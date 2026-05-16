import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminOperationLogService } from '../services/admin-operation-log.service';

@Controller('admin/logs')
@UseGuards(AdminJwtAuthGuard)
export class AdminLogsController {
  constructor(private readonly opLog: AdminOperationLogService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
  ) {
    return this.opLog.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      module,
    });
  }
}
