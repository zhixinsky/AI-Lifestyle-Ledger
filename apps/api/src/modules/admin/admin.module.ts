import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminSeedService } from './services/admin-seed.service';
import { AdminOperationLogService } from './services/admin-operation-log.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminUserInsightService } from './users/admin-user-insight.service';
import { AdminArticlesController } from './articles/admin-articles.controller';
import { AdminArticlesService } from './articles/admin-articles.service';
import { AdminAiController } from './ai/admin-ai.controller';
import { AdminAiService } from './ai/admin-ai.service';
import { AdminAnnouncementsController } from './announcements/admin-announcements.controller';
import { AdminAnnouncementsService, AnnouncementsPublicService } from './announcements/admin-announcements.service';
import { AdminMembershipsController } from './memberships/admin-memberships.controller';
import { AdminMembershipsService } from './memberships/admin-memberships.service';
import { AdminGrowthController } from './growth/admin-growth.controller';
import { AdminGrowthService } from './growth/admin-growth.service';
import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminSettingsService } from './settings/admin-settings.service';
import { AdminLifeSpacesController } from './life-spaces/admin-life-spaces.controller';
import { AdminLifeSpacesService } from './life-spaces/admin-life-spaces.service';
import { AdminLogsController } from './logs/admin-logs.controller';
import { AdminAdminsController } from './admins/admin-admins.controller';
import { AdminAdminsService } from './admins/admin-admins.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_SECRET') || 'moona-admin-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminUsersController,
    AdminArticlesController,
    AdminAiController,
    AdminAnnouncementsController,
    AdminMembershipsController,
    AdminGrowthController,
    AdminSettingsController,
    AdminLifeSpacesController,
    AdminLogsController,
    AdminAdminsController,
  ],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    AdminSeedService,
    AdminOperationLogService,
    AdminDashboardService,
    AdminUsersService,
    AdminUserInsightService,
    AdminArticlesService,
    AdminAiService,
    AdminAnnouncementsService,
    AnnouncementsPublicService,
    AdminMembershipsService,
    AdminGrowthService,
    AdminSettingsService,
    AdminLifeSpacesService,
    AdminAdminsService,
  ],
  exports: [AnnouncementsPublicService],
})
export class AdminModule {}
