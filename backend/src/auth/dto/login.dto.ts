import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ format: 'password', writeOnly: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
