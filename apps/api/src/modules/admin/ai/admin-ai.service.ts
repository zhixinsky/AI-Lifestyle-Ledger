import { Injectable, NotFoundException } from '@nestjs/common';
import { AiCorrectionType, Prisma, PromptExampleScene } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function mapAiLog(row: {
  id: string;
  userId: string;
  rawInput: string;
  aiResponse: unknown;
  intent: string | null;
  status: string | null;
  model: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: Date;
}) {
  const resp = row.aiResponse as Record<string, unknown> | null;
  return {
    id: row.id,
    userId: row.userId,
    inputText: row.rawInput,
    intent: row.intent ?? (resp?.intent as string) ?? (resp?.type as string) ?? null,
    status: row.status ?? 'success',
    model: row.model ?? (resp?.model as string) ?? null,
    durationMs: row.durationMs,
    createdAt: row.createdAt,
    errorMessage: row.errorMessage,
  };
}

@Injectable()
export class AdminAiService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(query: {
    page?: number;
    pageSize?: number;
    userId?: string;
    status?: string;
    intent?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.AiLogWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.intent) where.intent = query.intent;

    const [rows, total] = await Promise.all([
      this.prisma.aiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.aiLog.count({ where }),
    ]);
    return { items: rows.map(mapAiLog), total, page, pageSize };
  }

  async getLog(id: string) {
    const row = await this.prisma.aiLog.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('日志不存在');
    return {
      ...mapAiLog(row),
      rawInput: row.rawInput,
      aiResponse: row.aiResponse,
      finalResult: row.finalResult,
      prompt: row.prompt,
      confirmed: row.confirmed,
      userModified: row.userModified,
    };
  }

  async listCorrections(query: { page?: number; pageSize?: number; correctionType?: AiCorrectionType }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.AiCorrectionWhereInput = {};
    if (query.correctionType) where.correctionType = query.correctionType;

    const [items, total] = await Promise.all([
      this.prisma.aiCorrection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { nickname: true, phone: true } } },
      }),
      this.prisma.aiCorrection.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getCorrection(id: string) {
    const item = await this.prisma.aiCorrection.findUnique({
      where: { id },
      include: { aiLog: true, user: { select: { nickname: true, phone: true } } },
    });
    if (!item) throw new NotFoundException('纠错记录不存在');
    return item;
  }

  async addCorrectionToExamples(id: string) {
    const correction = await this.getCorrection(id);
    const example = await this.prisma.promptExample.create({
      data: {
        scene: 'bill_parse',
        inputText: correction.originalText,
        expectedJson: (correction.correctedResultJson ?? {}) as object,
        sort: 0,
      },
    });
    await this.prisma.aiCorrection.update({
      where: { id },
      data: { isAddedToPromptExamples: true },
    });
    return example;
  }

  async exportCorrections(format: 'jsonl' | 'csv') {
    const items = await this.prisma.aiCorrection.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 });
    if (format === 'jsonl') {
      return {
        format: 'jsonl',
        content: items.map((i) => JSON.stringify(i)).join('\n'),
      };
    }
    const header = 'id,userId,originalText,correctionType,createdAt\n';
    const rows = items
      .map((i) =>
        [i.id, i.userId, `"${i.originalText.replace(/"/g, '""')}"`, i.correctionType, i.createdAt.toISOString()].join(','),
      )
      .join('\n');
    return { format: 'csv', content: header + rows };
  }

  async listPromptExamples(scene?: PromptExampleScene) {
    return this.prisma.promptExample.findMany({
      where: scene ? { scene } : undefined,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createPromptExample(data: {
    scene: PromptExampleScene;
    inputText: string;
    expectedJson: object;
    enabled?: boolean;
    sort?: number;
  }) {
    return this.prisma.promptExample.create({ data });
  }

  async updatePromptExample(id: string, data: Prisma.PromptExampleUpdateInput) {
    return this.prisma.promptExample.update({ where: { id }, data });
  }

  async deletePromptExample(id: string) {
    await this.prisma.promptExample.delete({ where: { id } });
    return { ok: true };
  }

  async correctionStats() {
    const groups = await this.prisma.aiCorrection.groupBy({
      by: ['correctionType'],
      _count: true,
    });
    return groups;
  }
}
