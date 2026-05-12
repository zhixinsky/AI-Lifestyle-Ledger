import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class ChatHistoryItem {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class AiChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsOptional()
  history?: ChatHistoryItem[];
}
