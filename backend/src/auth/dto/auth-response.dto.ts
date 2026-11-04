import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/enums';

export class SafeUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Mero Event Admin' })
  name!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ format: 'uuid', nullable: true })
  vendorId!: string | null;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

export class ResetVendorPasswordResponseDto {
  @ApiProperty({ example: 'Vendor password reset successfully' })
  message!: string;

  @ApiProperty({
    description: 'One-time plaintext credential. Communicate it through a verified secure channel.',
  })
  temporaryPassword!: string;
}
