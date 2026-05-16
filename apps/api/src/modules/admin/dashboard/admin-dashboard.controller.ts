import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboard.summary();
  }

  @Get('trends')
  trends() {
    return this.dashboard.trends();
  }
}
