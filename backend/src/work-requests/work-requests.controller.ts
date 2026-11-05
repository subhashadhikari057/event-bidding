import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { COOKIE_AUTH_SCHEME } from '../auth/auth.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, WorkRequestStatus } from '../generated/prisma/enums';
import { CreateWorkRequestDto } from './dto/create-work-request.dto';
import { UpdateWorkRequestDto } from './dto/update-work-request.dto';
import { WorkRequestsService } from './work-requests.service';

const workRequestSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', example: 'Wedding Stage Decoration' },
    description: { type: 'string' },
    eventDate: { type: 'string', format: 'date-time' },
    eventLocation: { type: 'string', example: 'Kathmandu' },
    status: { type: 'string', enum: Object.values(WorkRequestStatus) },
    items: { type: 'array', items: { type: 'object' } },
    photos: { type: 'array', items: { type: 'object' } },
    createdBy: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

@ApiTags('Work Requests')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'ADMIN role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('work-requests')
export class WorkRequestsController {
  constructor(private readonly workRequests: WorkRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a DRAFT work request with at least one item' })
  @ApiCreatedResponse({ description: 'Work request created', schema: workRequestSchema })
  @ApiBadRequestResponse({ description: 'Request or nested item validation failed' })
  create(@Body() dto: CreateWorkRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.workRequests.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List work requests, newest first' })
  @ApiQuery({ name: 'status', required: false, enum: WorkRequestStatus })
  @ApiQuery({ name: 'search', required: false, description: 'Search title or event location' })
  @ApiOkResponse({ description: 'Work request summaries with item and invitation counts' })
  @ApiBadRequestResponse({ description: 'Invalid status filter' })
  findAll(@Query('status') status?: string, @Query('search') search?: string) {
    return this.workRequests.findAll(status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full work request details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ schema: workRequestSchema })
  @ApiBadRequestResponse({ description: 'Work request ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Work request does not exist' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.workRequests.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a DRAFT work request and optionally replace all items' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ schema: workRequestSchema })
  @ApiBadRequestResponse({ description: 'ID, request, or nested item validation failed' })
  @ApiNotFoundResponse({ description: 'Work request does not exist' })
  @ApiConflictResponse({ description: 'Only DRAFT requests can be modified' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateWorkRequestDto,
  ) {
    return this.workRequests.update(id, dto);
  }

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('photos', 5, {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  }))
  @ApiOperation({ summary: 'Upload up to five JPEG, PNG, or WebP reference photos to a DRAFT request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photos'],
      properties: {
        photos: {
          type: 'array',
          maxItems: 5,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Stored photo records',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          imageUrl: { type: 'string', example: '/uploads/work-requests/photo-id.jpg' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing, invalid, or too many photos' })
  @ApiPayloadTooLargeResponse({ description: 'A photo exceeds 5 MB' })
  @ApiNotFoundResponse({ description: 'Work request does not exist' })
  @ApiConflictResponse({ description: 'Photos can only be added to DRAFT requests' })
  addPhotos(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.workRequests.addPhotos(id, files ?? []);
  }
}
