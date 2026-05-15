import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as dayjs from 'dayjs';
import { parseAiJson } from '../parsers/ai-json.parser';
import type { ParsedBillResult, ParsedBillTransaction } from '../types/parsed-bill';
import { AiChatService } from './ai-chat.service';
import { AiPromptService } from './ai-prompt.service';

const categoryKeywords: Array<{ category: string; type: TransactionType; keywords: string[] }> = [
  { category: '餐饮', type: TransactionType.expense, keywords: ['饭', '餐', '午饭', '晚饭', '早餐', '外卖', '奶茶', '咖啡', '饮料', '水果', '超市'] },
  { category: '交通', type: TransactionType.expense, keywords: ['停车', '地铁', '公交', '打车', '出租', '高铁', '油费', '车费'] },
  { category: '购物', type: TransactionType.expense, keywords: ['买', '衣服', '鞋', '淘宝', '京东', '购物'] },
  { category: '娱乐', type: TransactionType.expense, keywords: ['电影', '游戏', '演唱会', '娱乐', '会员'] },
  { category: '医疗', type: TransactionType.expense, keywords: ['药', '医院', '门诊', '医疗'] },
  { category: '住房', type: TransactionType.expense, keywords: ['房租', '物业', '水电', '燃气'] },
  { category: '学习', type: TransactionType.expense, keywords: ['书', '课程', '学习', '培训'] },
  { category: '工资', type: TransactionType.income, keywords: ['工资', '奖金', '收入', '报销'] }
];

@Injectable()
export class BillParserService {
  constructor(
    private readonly aiChat: AiChatService,
    private readonly prompts: AiPromptService
  ) {}

  async parse(input: string, occurredAt?: string): Promise<ParsedBillResult> {
    const currentTime = occurredAt || new Date().toISOString();
    const aiContent = await this.aiChat.complete([
      { role: 'system', content: this.prompts.getBillParserPrompt() },
      { role: 'user', content: `当前时间：${currentTime}\n用户输入：${input}` }
    ]);

    if (aiContent) {
      const parsed = parseAiJson<ParsedBillResult>(aiContent);
      return this.normalize(parsed, currentTime);
    }

    return this.parseByRules(input, currentTime);
  }

  private normalize(result: ParsedBillResult, currentTime: string): ParsedBillResult {
    return {
      transactions: (result.transactions || [])
        .filter((item) => Number(item.amount) > 0)
        .map((item) => ({
          type: item.type || TransactionType.expense,
          amount: Number(item.amount),
          category: item.category || '其它',
          remark: item.remark || item.category || 'AI 记账',
          occurredAt: item.occurredAt || currentTime,
          tags: item.tags || []
        }))
    };
  }

  private parseByRules(input: string, currentTime: string): ParsedBillResult {
    const segments = input
      .split(/[，,；;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const transactions = segments
      .map((segment) => this.parseSegment(segment, currentTime))
      .filter((item): item is ParsedBillTransaction => Boolean(item));

    return { transactions };
  }

  private parseSegment(segment: string, currentTime: string): ParsedBillTransaction | null {
    const match = segment.match(/(.+?)(\d+(?:\.\d{1,2})?)(?:元|块|￥|¥)?$/);
    if (!match) return null;

    const remark = match[1].trim();
    const amount = Number(match[2]);
    const category = this.detectCategory(remark);

    return {
      type: category.type,
      amount,
      category: category.category,
      remark: remark || category.category,
      occurredAt: this.detectTime(segment, currentTime),
      tags: []
    };
  }

  private detectCategory(text: string) {
    return categoryKeywords.find((item) => item.keywords.some((keyword) => text.includes(keyword)))
      || { category: '其它', type: TransactionType.expense };
  }

  private detectTime(text: string, currentTime: string) {
    const base = dayjs(currentTime);
    if (text.includes('昨天')) return base.subtract(1, 'day').toISOString();
    if (text.includes('前天')) return base.subtract(2, 'day').toISOString();
    return base.toISOString();
  }
}
