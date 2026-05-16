import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminSettingsService } from './admin-settings.service';

@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  list() {
    return this.settings.list();
  }

  @Patch(':key')
  update(
    @CurrentAdmin() admin: { sub: string },
    @Param('key') key: string,
    @Body('value') value: unknown,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.settings.update(admin.sub, key, value, ip);
  }
}
