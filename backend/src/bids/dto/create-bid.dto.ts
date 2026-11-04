import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

export class CreateBidDto {
  @ApiProperty({
    type: String,
    example: '75000.00',
    description: 'Positive NPR amount with at most two decimal places; maximum 9999999999.99.',
  })
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a decimal string with at most two decimal places' })
  amount!: string;

  @ApiPropertyOptional({ example: 'Includes stage decoration, flowers, lighting and installation.', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  notes?: string;
}
