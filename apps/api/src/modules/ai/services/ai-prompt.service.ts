import { Injectable } from '@nestjs/common';
import { billParserSystemPrompt } from '../prompts/bill-parser.prompt';
import { dailyReportSystemPrompt } from '../prompts/daily-report.prompt';
import { monthlyReportSystemPrompt } from '../prompts/monthly-report.prompt';
import { financialChatSystemPrompt } from '../prompts/financial-chat.prompt';
import { insightSystemPrompt } from '../prompts/insight.prompt';

@Injectable()
export class AiPromptService {
  getBillParserPrompt() {
    return billParserSystemPrompt;
  }

  getDailyReportPrompt() {
    return dailyReportSystemPrompt;
  }

  getMonthlyReportPrompt() {
    return monthlyReportSystemPrompt;
  }

  getFinancialChatPrompt() {
    return financialChatSystemPrompt;
  }

  getInsightPrompt() {
    return insightSystemPrompt;
  }
}
