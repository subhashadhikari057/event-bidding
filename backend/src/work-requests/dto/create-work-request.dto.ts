import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRequestItemDto {
  @ApiProperty({ example: 'Stage Decoration', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Premium wedding stage setup', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'set', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit?: string;
}

export class CreateWorkRequestDto {
  @ApiProperty({ example: 'Wedding Stage Decoration', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Stage decoration and lighting for a wedding reception.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({
    example: '2026-12-15T10:00:00.000Z',
    format: 'date-time',
    description: 'ISO 8601 date-time with an explicit timezone; stored as an absolute UTC instant.',
  })
  @IsDateString({ strict: true })
  eventDate!: string;

  @ApiProperty({ example: 'Kathmandu', maxLength: 250 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  eventLocation!: string;

  @ApiProperty({ type: [CreateRequestItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRequestItemDto)
  items!: CreateRequestItemDto[];
}
