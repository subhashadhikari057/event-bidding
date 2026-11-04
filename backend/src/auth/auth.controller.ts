import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '../generated/prisma/enums';
import {
  AUTH_COOKIE_NAME,
  COOKIE_AUTH_SCHEME,
  authCookieOptions,
  clearAuthCookieOptions,
} from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  MessageResponseDto,
  ResetVendorPasswordResponseDto,
  SafeUserResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and set the HTTP-only access cookie' })
  @ApiOkResponse({ type: SafeUserResponseDto })
  @ApiBadRequestResponse({ description: 'Request validation failed' })
  @ApiUnauthorizedResponse({ description: 'Credentials or account state are invalid' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SafeUserResponseDto> {
    const result = await this.auth.login(dto);
    response.cookie(AUTH_COOKIE_NAME, result.token, authCookieOptions(this.config));
    return result.user;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(COOKIE_AUTH_SCHEME)
  @ApiOperation({ summary: 'Get the current authenticated profile' })
  @ApiOkResponse({ type: SafeUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
  me(@CurrentUser() user: AuthenticatedUser): SafeUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear the access cookie',
    description: 'Idempotent. Clearing the browser cookie does not invalidate copied JWTs.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  logout(@Res({ passthrough: true }) response: Response): MessageResponseDto {
    response.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions(this.config));
    return { message: 'Logged out successfully' };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(COOKIE_AUTH_SCHEME)
  @ApiOperation({ summary: 'Change the current account password and require login again' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'The new password does not meet requirements' })
  @ApiUnauthorizedResponse({ description: 'Authentication or current password is invalid' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    const result = await this.auth.changePassword(user, dto);
    response.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions(this.config));
    return result;
  }

  @Post('vendors/:vendorId/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(COOKIE_AUTH_SCHEME)
  @ApiOperation({
    summary: 'Generate a one-time vendor password (ADMIN only)',
    description: 'The plaintext credential is returned once and must be shared through a verified secure channel.',
  })
  @ApiParam({ name: 'vendorId', format: 'uuid' })
  @ApiOkResponse({
    type: ResetVendorPasswordResponseDto,
    headers: {
      'Cache-Control': {
        description: 'Prevents storage of the one-time credential response',
        schema: { type: 'string', example: 'no-store' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'The vendor or linked account is inactive' })
  @ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
  @ApiForbiddenResponse({ description: 'ADMIN role is required' })
  @ApiNotFoundResponse({ description: 'Vendor or linked VENDOR account does not exist' })
  async resetVendorPassword(
    @Param('vendorId', new ParseUUIDPipe({ version: '4' })) vendorId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResetVendorPasswordResponseDto> {
    response.setHeader('Cache-Control', 'no-store');
    return this.auth.resetVendorPassword(vendorId);
  }
}
