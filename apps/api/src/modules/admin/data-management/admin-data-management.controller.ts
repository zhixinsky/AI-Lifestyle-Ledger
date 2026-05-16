import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { DataManagementService } from '../../data-management/data-management.service';

class ParseBase64Dto {
  @IsString()
  fileName: string;

  @IsString()
  contentBase64: string;
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

@Controller('admin/users/:userId/data-management')
@UseGuards(AdminJwtAuthGuard)
export class AdminDataManagementController {
  constructor(private readonly dataManagement: DataManagementService) {}

  @Get('life-spaces')
  listLifeSpaces(@Param('userId') userId: string) {
    return this.dataManagement.listLifeSpaces(userId);
  }

  @Post('import/parse')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  parseImport(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.dataManagement.parseImport(userId, file);
  }

  @Post('import/parse-base64')
  parseImportBase64(@Param('userId') userId: string, @Body() body: ParseBase64Dto) {
    const buffer = Buffer.from(body.contentBase64, 'base64');
    const pseudo = {
      buffer,
      originalname: body.fileName || 'import.csv',
      size: buffer.length,
    } as Express.Multer.File;
    return this.dataManagement.parseImport(userId, pseudo);
  }

  @Post('import/confirm')
  confirmImport(
    @Param('userId') userId: string,
    @Body() dto: ConfirmImportDto,
  ) {
    return this.dataManagement.confirmImport(userId, dto.sessionId, dto.lifeSpaceId);
  }

  @Post('import/:batchId/rollback')
  rollbackImport(@Param('userId') userId: string, @Param('batchId') batchId: string) {
    return this.dataManagement.rollbackImport(userId, batchId);
  }

  @Get('import/batches')
  listImportBatches(@Param('userId') userId: string, @Query() query: PaginationQuery) {
    return this.dataManagement.listImportBatches(userId, query.page, query.pageSize);
  }

  @Post('export')
  createExport(@Param('userId') userId: string, @Body() dto: ExportDto) {
    return this.dataManagement.createExport(userId, dto);
  }

  @Get('export/batches')
  listExportBatches(@Param('userId') userId: string, @Query() query: PaginationQuery) {
    return this.dataManagement.listExportBatches(userId, query.page, query.pageSize);
  }

  @Get('export/:batchId/download')
  async downloadExport(
    @Param('userId') userId: string,
    @Param('batchId') batchId: string,
    @Res() res: Response,
  ) {
    const file = await this.dataManagement.resolveExportDownload(userId, batchId);
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
