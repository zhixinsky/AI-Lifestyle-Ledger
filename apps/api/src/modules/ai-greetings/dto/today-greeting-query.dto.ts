import { IsEnum, IsOptional, Matches } from 'class-validator';
import { AiGreetingPeriod } from '@prisma/client';

export class TodayGreetingQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsEnum(AiGreetingPeriod)
  period!: AiGreetingPeriod;
}
