import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportFormat, TransactionType } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataManagementService } from './data-management.service';

class ParseBase64Dto {
  @IsString()
  fileName: string;

  @IsString()
  contentBase64: string;
}

class ParseTextDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

class ConfirmImportDto {
  @IsString()
  sessionId: string;

  @IsString()
  lifeSpaceId: string;
}

class ExportDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  lifeSpaceId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

@Controller('data-management')
@UseGuards(JwtAuthGuard)
export class DataManagementController {
  constructor(private readonly dataManagement: DataManagementService) {}

  @Get('life-spaces')
  listLifeSpaces(@Req() req: { user: { sub: string } }) {
    return this.dataManagement.listLifeSpaces(req.user.sub);
  }

  @Post('import/parse')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  parseImport(
    @Req() req: { user: { sub: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.dataManagement.parseImport(req.user.sub, file);
  }

  @Post('import/parse-base64')
  parseImportBase64(@Req() req: { user: { sub: string } }, @Body() body: ParseBase64Dto) {
    const buffer = Buffer.from(body.contentBase64, 'base64');
    const pseudo = {
      buffer,
      originalname: body.fileName || 'import.csv',
      size: buffer.length,
    } as Express.Multer.File;
    return this.dataManagement.parseImport(req.user.sub, pseudo);
  }

  @Post('import/parse-text')
  parseImportText(@Req() req: { user: { sub: string } }, @Body() body: ParseTextDto) {
    if (!body.content?.trim()) throw new BadRequestException('请粘贴 CSV 内容');
    return this.dataManagement.parseImportText(
      req.user.sub,
      body.content,
      body.fileName || 'paste.csv',
    );
  }

  @Post('import/confirm')
  confirmImport(@Req() req: { user: { sub: string } }, @Body() dto: ConfirmImportDto) {
    return this.dataManagement.confirmImport(req.user.sub, dto.sessionId, dto.lifeSpaceId);
  }

  @Post('import/:batchId/rollback')
  rollbackImport(@Req() req: { user: { sub: string } }, @Param('batchId') batchId: string) {
    return this.dataManagement.rollbackImport(req.user.sub, batchId);
  }

  @Get('import/batches')
  listImportBatches(@Req() req: { user: { sub: string } }, @Query() query: PaginationQuery) {
    return this.dataManagement.listImportBatches(req.user.sub, query.page, query.pageSize);
  }

  @Post('export')
  createExport(@Req() req: { user: { sub: string } }, @Body() dto: ExportDto) {
    return this.dataManagement.createExport(req.user.sub, dto);
  }

  @Get('export/batches')
  listExportBatches(@Req() req: { user: { sub: string } }, @Query() query: PaginationQuery) {
    return this.dataManagement.listExportBatches(req.user.sub, query.page, query.pageSize);
  }

  @Get('export/:batchId/download')
  async downloadExport(
    @Req() req: { user: { sub: string } },
    @Param('batchId') batchId: string,
    @Res() res: Response,
  ) {
    const file = await this.dataManagement.resolveExportDownload(req.user.sub, batchId);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    createReadStream(file.path).pipe(res);
  }

  @Get('template/:format')
  downloadTemplate(@Param('format') format: ExportFormat, @Res() res: Response) {
    const f = format === ExportFormat.csv ? ExportFormat.csv : ExportFormat.xlsx;
    const { buffer, fileName } = this.dataManagement.getTemplateBuffer(f);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(buffer);
  }
}
