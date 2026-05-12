import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendCodeDto {
  @IsPhoneNumber('CN')
  @IsNotEmpty()
  phone: string;
}
