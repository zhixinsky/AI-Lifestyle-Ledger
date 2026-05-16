import { AiInputType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ParseBillDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;

  @IsOptional()
  @IsEnum(AiInputType)
  inputType?: AiInputType;
}
