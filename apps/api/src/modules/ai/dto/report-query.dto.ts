import { IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  month?: string;
}
