import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ParseBillDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;
}
