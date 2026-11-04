import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { COOKIE_AUTH_SCHEME } from '../auth/auth.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../generated/prisma/enums';
import { CreateInvitationsDto } from './dto/create-invitations.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'ADMIN role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('work-requests')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite active vendors and open a DRAFT request atomically' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Created invitation records with safe vendor details' })
  @ApiBadRequestResponse({ description: 'Invalid request ID or vendor ID array' })
  @ApiNotFoundResponse({ description: 'Work request or selected vendor does not exist' })
  @ApiConflictResponse({ description: 'Invalid request state, inactive vendor, or duplicate invitation' })
  create(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateInvitationsDto,
  ) {
    return this.invitations.create(id, dto.vendorIds);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List vendors invited to a work request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Invitations sorted newest first with safe vendor information' })
  @ApiBadRequestResponse({ description: 'Work request ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Work request does not exist' })
  findAll(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.invitations.findForRequest(id);
  }
}
