import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser, JwtPayload } from './auth.types';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';
import type {
  MessageResponseDto,
  ResetVendorPasswordResponseDto,
  SafeUserResponseDto,
} from './dto/auth-response.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ token: string; user: SafeUserResponseDto }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { vendor: true },
    });

    if (
      !user
      || !user.isActive
      || Buffer.byteLength(dto.password, 'utf8') > 72
      || !(await bcrypt.compare(dto.password, user.passwordHash))
      || (user.role === UserRole.VENDOR && (!user.vendor || !user.vendor.isActive))
    ) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      token: await this.jwt.signAsync(payload),
      user: this.safeUser(user),
    };
  }

  async changePassword(
    currentUser: AuthenticatedUser,
    dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    this.validateNewPassword(dto.newPassword);

    const user = await this.prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async resetVendorPassword(vendorId: string): Promise<ResetVendorPasswordResponseDto> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor || !vendor.user || vendor.user.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor account not found');
    }

    if (!vendor.isActive || !vendor.user.isActive) {
      throw new BadRequestException('Inactive vendor accounts cannot have their password reset');
    }

    const temporaryPassword = randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: vendor.user.id },
      data: { passwordHash },
    });

    return {
      message: 'Vendor password reset successfully',
      temporaryPassword,
    };
  }

  private validateNewPassword(password: string): void {
    const byteLength = Buffer.byteLength(password, 'utf8');
    if (byteLength < 6 || byteLength > 72) {
      throw new BadRequestException('New password must contain between 6 and 72 UTF-8 bytes');
    }
  }

  private safeUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    vendorId: string | null;
  }): SafeUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
    };
  }
}
