import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ConfirmBillTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  remark: string;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ConfirmBillDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmBillTransactionDto)
  transactions: ConfirmBillTransactionDto[];

  @IsOptional()
  @IsString()
  lifeSpaceId?: string;
}
