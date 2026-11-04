import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: 'Everest Photography', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName!: string;

  @ApiProperty({ example: 'Ram Sharma', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contactPerson!: string;

  @ApiProperty({ example: 'everest@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '9800000000', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

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

  @ApiProperty({ example: 'StrongPassword123!', format: 'password', minLength: 6, maxLength: 72, writeOnly: true })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
