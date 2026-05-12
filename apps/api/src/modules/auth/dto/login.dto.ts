import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('CN')
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
