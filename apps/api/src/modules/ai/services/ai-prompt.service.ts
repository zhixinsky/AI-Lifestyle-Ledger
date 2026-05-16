import { Injectable } from '@nestjs/common';
import { PromptExampleScene } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { billParserSystemPrompt } from '../prompts/bill-parser.prompt';
import { dailyReportSystemPrompt } from '../prompts/daily-report.prompt';
import { monthlyReportSystemPrompt } from '../prompts/monthly-report.prompt';
import { financialChatSystemPrompt } from '../prompts/financial-chat.prompt';
import { insightSystemPrompt } from '../prompts/insight.prompt';

@Injectable()
export class AiPromptService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillParserPrompt() {
    const examples = await this.prisma.promptExample.findMany({
      where: { scene: PromptExampleScene.bill_parse, enabled: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    });
    if (!examples.length) return billParserSystemPrompt;

    const block = examples
      .map((ex, i) => {
        const expected =
          typeof ex.expectedJson === 'string' ? ex.expectedJson : JSON.stringify(ex.expectedJson);
        return `示例${i + 1}\n用户输入：${ex.inputText}\n期望输出：${expected}`;
      })
      .join('\n\n');

    return `${billParserSystemPrompt}\n\n以下为运营维护的高频纠错示例，解析时请优先参考：\n\n${block}`;
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
