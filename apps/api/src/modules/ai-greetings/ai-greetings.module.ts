import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AiGreetingCronService } from './ai-greeting-cron.service';
import { AiGreetingDailyService } from './ai-greeting-daily.service';
import { AiGreetingsController } from './ai-greetings.controller';

@Module({
  imports: [AiModule],
  controllers: [AiGreetingsController],
  providers: [AiGreetingDailyService, AiGreetingCronService],
})
export class AiGreetingsModule {}
