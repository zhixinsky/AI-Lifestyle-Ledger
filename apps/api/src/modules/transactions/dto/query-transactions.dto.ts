import { IsOptional, IsString } from 'class-validator';

export class QueryTransactionsDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
