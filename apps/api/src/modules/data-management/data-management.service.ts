import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExportBatchStatus,
  ExportFormat,
  ImportBatchStatus,
  ImportFormat,
  Prisma,
  TransactionType,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { LifeSpacesService } from '../life-spaces/life-spaces.service';
import {
  buildRemark,
  parseImportFile,
  ParsedImportRow,
  TEMPLATE_HEADERS,
} from './import-parser';

const SESSION_TTL_HOURS = 2;
const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'data-management');

@Injectable()
export class DataManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly lifeSpacesService: LifeSpacesService,
  ) {
    mkdirSync(join(UPLOAD_ROOT, 'imports'), { recursive: true });
    mkdirSync(join(UPLOAD_ROOT, 'exports'), { recursive: true });
  }

  async listLifeSpaces(userId: string) {
    return this.lifeSpacesService.list(userId);
  }

  async parseImport(userId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('请上传文件');
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('文件不能超过 8MB');

    const { format, headers, rows } = parseImportFile(file.buffer, file.originalname);
    const sessionId = randomUUID();
    const storedName = `${sessionId}-${file.originalname}`;
    const filePath = join(UPLOAD_ROOT, 'imports', storedName);
    writeFileSync(filePath, file.buffer);

    const expiresAt = dayjs().add(SESSION_TTL_HOURS, 'hour').toDate();
    await this.prisma.importSession.create({
      data: {
        id: sessionId,
        userId,
        fileName: file.originalname,
        format,
        filePath,
        totalRows: rows.length,
        parsedRows: rows as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    const defaultSpace = await this.lifeSpacesService.ensureDefault(userId);
    const lifeSpaces = await this.lifeSpacesService.list(userId);

    return {
      sessionId,
      format,
      headers,
      totalRows: rows.length,
      preview: rows.slice(0, 20),
      lifeSpaces,
      defaultLifeSpaceId: defaultSpace.id,
    };
  }

  async confirmImport(userId: string, sessionId: string, lifeSpaceId: string) {
    const session = await this.prisma.importSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('导入会话不存在或已过期');
    if (session.expiresAt < new Date()) {
      throw new BadRequestException('导入会话已过期，请重新上传');
    }

    const space = await this.prisma.lifeSpace.findFirst({
      where: { id: lifeSpaceId, userId },
    });
    if (!space) throw new BadRequestException('生活空间不存在');

    const rows = session.parsedRows as unknown as ParsedImportRow[];
    await this.categoriesService.ensureDefaults();

    const batch = await this.prisma.importBatch.create({
      data: {
        userId,
        fileName: session.fileName,
        format: session.format,
        lifeSpaceId,
        status: ImportBatchStatus.pending,
        totalRows: rows.length,
      },
    });

    let successRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (row.errors.length) {
        failedRows++;
        if (errors.length < 10) errors.push(`第${row.rowIndex}行: ${row.errors.join('、')}`);
        continue;
      }
      try {
        const category = await this.findOrCreateCategory(row.categoryName!, row.type!);
        await this.prisma.transaction.create({
          data: {
            userId,
            categoryId: category.id,
            lifeSpaceId,
            type: row.type!,
            amount: row.amount!,
            occurredAt: dayjs(row.transactionDate).toDate(),
            remark: buildRemark(row.note, row.accountName),
            source: 'manual',
            importBatchId: batch.id,
          },
        });
        successRows++;
      } catch (e: unknown) {
        failedRows++;
        const msg = e instanceof Error ? e.message : '写入失败';
        if (errors.length < 10) errors.push(`第${row.rowIndex}行: ${msg}`);
      }
    }

    const status =
      successRows === 0 ? ImportBatchStatus.failed : ImportBatchStatus.completed;
    const updated = await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status,
        successRows,
        failedRows,
        errorSummary: errors.length ? errors.join('\n') : null,
      },
    });

    await this.prisma.importSession.delete({ where: { id: sessionId } });
    this.safeUnlink(session.filePath);

    return {
      batchId: updated.id,
      status: updated.status,
      totalRows: updated.totalRows,
      successRows: updated.successRows,
      failedRows: updated.failedRows,
      errorSummary: updated.errorSummary,
    };
  }

  async rollbackImport(userId: string, batchId: string) {
    const batch = await this.prisma.importBatch.findFirst({
      where: { id: batchId, userId },
    });
    if (!batch) throw new NotFoundException('导入记录不存在');
    if (batch.status === ImportBatchStatus.rolled_back) {
      throw new BadRequestException('该批次已撤回');
    }
    if (batch.status === ImportBatchStatus.pending) {
      throw new BadRequestException('导入未完成，无法撤回');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany({ where: { importBatchId: batchId, userId } }),
      this.prisma.importBatch.update({
        where: { id: batchId },
        data: { status: ImportBatchStatus.rolled_back, rolledBackAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async listImportBatches(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.importBatch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { lifeSpace: { select: { name: true } } },
      }),
      this.prisma.importBatch.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize: take };
  }

  async createExport(
    userId: string,
    dto: {
      format: ExportFormat;
      dateFrom?: string;
      dateTo?: string;
      lifeSpaceId?: string;
      type?: TransactionType;
    },
  ) {
    const where: Prisma.TransactionWhereInput = { userId };
    if (dto.lifeSpaceId) where.lifeSpaceId = dto.lifeSpaceId;
    if (dto.type) where.type = dto.type;
    if (dto.dateFrom || dto.dateTo) {
      where.occurredAt = {};
      if (dto.dateFrom) where.occurredAt.gte = dayjs(dto.dateFrom).startOf('day').toDate();
      if (dto.dateTo) where.occurredAt.lte = dayjs(dto.dateTo).endOf('day').toDate();
    }

    const rows = await this.prisma.transaction.findMany({
      where,
      include: { category: true, lifeSpace: true },
      orderBy: { occurredAt: 'desc' },
    });

    const batch = await this.prisma.exportBatch.create({
      data: {
        userId,
        format: dto.format,
        lifeSpaceId: dto.lifeSpaceId,
        type: dto.type,
        dateFrom: dto.dateFrom ? dayjs(dto.dateFrom).toDate() : undefined,
        dateTo: dto.dateTo ? dayjs(dto.dateTo).toDate() : undefined,
        status: ExportBatchStatus.pending,
        rowCount: rows.length,
      },
    });

    try {
      const exportRows = rows.map((tx) => {
        const accountMatch = tx.remark?.match(/\[账户:([^\]]+)\]/);
        const accountName = accountMatch?.[1] ?? '未关联';
        const note = tx.remark?.replace(/\s*\[账户:[^\]]+\]\s*/g, '').trim() || '';
        return {
          日期: dayjs(tx.occurredAt).format('YYYY-MM-DD'),
          收支类型: tx.type === TransactionType.income ? '收入' : '支出',
          类别: tx.category.name,
          账户: accountName,
          金额: Number(tx.amount),
          备注: note,
        };
      });

      const fileName = `export-${batch.id}.${dto.format === ExportFormat.csv ? 'csv' : 'xlsx'}`;
      const filePath = join(UPLOAD_ROOT, 'exports', fileName);

      if (dto.format === ExportFormat.csv) {
        const header = TEMPLATE_HEADERS.join(',');
        const body = exportRows
          .map((r) =>
            [r.日期, r.收支类型, r.类别, r.账户, r.金额, r.备注]
              .map((c) => `"${String(c).replace(/"/g, '""')}"`)
              .join(','),
          )
          .join('\n');
        writeFileSync(filePath, `\uFEFF${header}\n${body}`, 'utf8');
      } else {
        const sheet = XLSX.utils.json_to_sheet(exportRows, { header: TEMPLATE_HEADERS });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '账单');
        XLSX.writeFile(wb, filePath);
      }

      const updated = await this.prisma.exportBatch.update({
        where: { id: batch.id },
        data: {
          status: ExportBatchStatus.completed,
          fileName,
          filePath: `data-management/exports/${fileName}`,
        },
      });

      return {
        batchId: updated.id,
        fileName: updated.fileName,
        rowCount: updated.rowCount,
        downloadUrl: `/uploads/${updated.filePath}`,
      };
    } catch (e: unknown) {
      await this.prisma.exportBatch.update({
        where: { id: batch.id },
        data: { status: ExportBatchStatus.failed },
      });
      throw new BadRequestException(e instanceof Error ? e.message : '导出失败');
    }
  }

  async listExportBatches(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.exportBatch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { lifeSpace: { select: { name: true } } },
      }),
      this.prisma.exportBatch.count({ where: { userId } }),
    ]);
    return {
      items: items.map((b) => ({
        ...b,
        downloadUrl: b.filePath ? `/uploads/${b.filePath}` : null,
      })),
      total,
      page,
      pageSize: take,
    };
  }

  getExportFile(userId: string, batchId: string) {
    const batch = this.prisma.exportBatch.findFirst({ where: { id: batchId, userId } });
    return batch;
  }

  async resolveExportDownload(userId: string, batchId: string) {
    const batch = await this.prisma.exportBatch.findFirst({
      where: { id: batchId, userId, status: ExportBatchStatus.completed },
    });
    if (!batch?.filePath) throw new NotFoundException('导出文件不存在');
    const abs = join(process.cwd(), 'uploads', batch.filePath);
    if (!existsSync(abs)) throw new NotFoundException('文件已失效');
    return {
      path: abs,
      fileName: batch.fileName || `export-${batchId}.xlsx`,
    };
  }

  getTemplateBuffer(format: ExportFormat) {
    const sample = [
      {
        日期: '2026-01-15',
        收支类型: '支出',
        类别: '餐饮',
        账户: '微信',
        金额: 35.5,
        备注: '午餐',
      },
    ];
    if (format === ExportFormat.csv) {
      const header = TEMPLATE_HEADERS.join(',');
      const row = sample
        .map((r) =>
          TEMPLATE_HEADERS.map((h) => `"${String((r as Record<string, unknown>)[h] ?? '')}"`).join(','),
        )
        .join('\n');
      return { buffer: Buffer.from(`\uFEFF${header}\n${row}`, 'utf8'), fileName: 'moona-import-template.csv' };
    }
    const sheet = XLSX.utils.json_to_sheet(sample, { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, '模板');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return { buffer, fileName: 'moona-import-template.xlsx' };
  }

  private async findOrCreateCategory(name: string, type: TransactionType) {
    const existing = await this.prisma.category.findUnique({
      where: { name_type: { name, type } },
    });
    if (existing) return existing;
    try {
      return await this.categoriesService.create({
        name,
        type,
        icon: '📦',
        color: '#94a3b8',
      });
    } catch {
      return this.prisma.category.findUniqueOrThrow({
        where: { name_type: { name, type } },
      });
    }
  }

  private safeUnlink(path: string) {
    try {
      if (existsSync(path)) unlinkSync(path);
    } catch {
      /* ignore */
    }
  }
}
