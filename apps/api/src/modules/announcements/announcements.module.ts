import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsPublicService } from '../admin/announcements/admin-announcements.service';

@Module({
  controllers: [AnnouncementsController],
  providers: [AnnouncementsPublicService],
})
export class AnnouncementsModule {}
