import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateRequestItemDto } from './create-work-request.dto';

export class UpdateWorkRequestDto {
  @ApiPropertyOptional({ example: 'Wedding Stage Decoration', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated decoration requirements.', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: '2026-12-15T10:00:00.000Z',
    format: 'date-time',
    description: 'ISO 8601 date-time with an explicit timezone; stored as an absolute UTC instant.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  eventDate?: string;

  @ApiPropertyOptional({ example: 'Kathmandu', maxLength: 250 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  eventLocation?: string;

  @ApiPropertyOptional({ type: [CreateRequestItemDto], minItems: 1 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRequestItemDto)
  items?: CreateRequestItemDto[];
}
