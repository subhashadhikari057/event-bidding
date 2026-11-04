import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ format: 'password', writeOnly: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({ format: 'password', minLength: 6, maxLength: 72, writeOnly: true })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword!: string;
}
