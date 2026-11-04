import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { COOKIE_AUTH_SCHEME } from '../auth/auth.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../generated/prisma/enums';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

const accountSchema = {
  type: 'object' as const,
  nullable: true,
  required: ['id', 'name', 'email', 'role', 'isActive'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'Ram Sharma' },
    email: { type: 'string', format: 'email', example: 'everest@example.com' },
    role: { type: 'string', enum: ['VENDOR'] },
    isActive: { type: 'boolean', example: true },
  },
};

const vendorSchema = {
  type: 'object' as const,
  required: [
    'id',
    'companyName',
    'contactPerson',
    'email',
    'phone',
    'address',
    'category',
    'isActive',
    'createdAt',
    'updatedAt',
    'user',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    companyName: { type: 'string', example: 'Everest Photography' },
    contactPerson: { type: 'string', example: 'Ram Sharma' },
    email: { type: 'string', format: 'email', example: 'everest@example.com' },
    phone: { type: 'string', example: '9800000000' },
    address: { type: 'string', nullable: true, example: 'Kathmandu' },
    category: { type: 'string', nullable: true, example: 'Photography' },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    user: accountSchema,
  },
};

@ApiTags('Vendors')
@ApiCookieAuth(COOKIE_AUTH_SCHEME)
@ApiUnauthorizedResponse({ description: 'Authentication is missing, invalid, or expired' })
@ApiForbiddenResponse({ description: 'ADMIN role is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vendor and linked VENDOR account' })
  @ApiCreatedResponse({ description: 'Vendor created', schema: vendorSchema })
  @ApiBadRequestResponse({ description: 'Request or password validation failed' })
  @ApiConflictResponse({ description: 'Email is already used by a user or vendor' })
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vendors, newest first' })
  @ApiQuery({ name: 'search', required: false, description: 'Company name or email search' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Vendor list', schema: { type: 'array', items: vendorSchema } })
  @ApiBadRequestResponse({ description: 'isActive must be true or false' })
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.vendors.findAll(search, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Vendor details', schema: vendorSchema })
  @ApiBadRequestResponse({ description: 'Vendor ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Vendor does not exist' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.vendors.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor and linked login identity' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Vendor updated', schema: vendorSchema })
  @ApiBadRequestResponse({ description: 'Vendor ID or request validation failed' })
  @ApiNotFoundResponse({ description: 'Vendor does not exist' })
  @ApiConflictResponse({ description: 'Email is already used by a user or vendor' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendors.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a vendor and linked account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Vendor status updated', schema: vendorSchema })
  @ApiBadRequestResponse({ description: 'Vendor ID or status validation failed' })
  @ApiNotFoundResponse({ description: 'Vendor does not exist' })
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    return this.vendors.updateStatus(id, dto.isActive);
  }
}
