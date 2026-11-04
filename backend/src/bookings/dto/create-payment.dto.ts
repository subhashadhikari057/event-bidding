import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';
import { MONEY_PATTERN } from '../../bids/dto/create-bid.dto';

export class CreatePaymentDto {
  @ApiProperty({ type: String, example: '20000.00' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a decimal string with at most two decimal places' })
  amount!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ example: 'BANK-TXN-12345', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({ example: 'Advance payment to vendor', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-11-04T10:00:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  paidAt?: string;
}
