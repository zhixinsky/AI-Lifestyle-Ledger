import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAiTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['parse_bill', 'chat'])
  type: 'parse_bill' | 'chat';

  @IsString()
  @IsOptional()
  inputText?: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;

  @IsString()
  @IsOptional()
  intent?: string;
}
