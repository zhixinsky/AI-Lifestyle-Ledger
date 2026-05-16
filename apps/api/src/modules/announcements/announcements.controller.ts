import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AnnouncementPosition } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AnnouncementsPublicService } from '../admin/announcements/admin-announcements.service';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsPublicService) {}

  @Get('active')
  active(
    @CurrentUser() user: { sub: string },
    @Query('position') position?: AnnouncementPosition,
  ) {
    return this.announcements.activeForUser(user.sub, position);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.announcements.markRead(user.sub, id);
  }
}
