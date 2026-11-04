import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 'Everest Photography', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Ram Sharma', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'everest@example.com', maxLength: 254 })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '9800000000', maxLength: 30 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Kathmandu', maxLength: 250 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  address?: string;

  @ApiPropertyOptional({ example: 'Photography', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category?: string;
}
