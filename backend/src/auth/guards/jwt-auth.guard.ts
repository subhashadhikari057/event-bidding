import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_COOKIE_NAME } from '../auth.constants';
import type { AuthenticatedUser, JwtPayload } from '../auth.types';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { vendor: true },
    });

    if (!user || !user.isActive || user.role !== payload.role) {
      throw new UnauthorizedException('Invalid or expired authentication');
    }

    if (user.role === 'VENDOR' && (!user.vendor || !user.vendor.isActive)) {
      throw new UnauthorizedException('Invalid or expired authentication');
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
      isActive: user.isActive,
    };
    return true;
  }
}
