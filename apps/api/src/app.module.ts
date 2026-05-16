import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SavingGoalsModule } from './modules/saving-goals/saving-goals.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { WealthModule } from './modules/wealth/wealth.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { MembershipModule } from './modules/membership/membership.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SharedBookModule } from './modules/shared-book/shared-book.module';
import { GrowthModule } from './modules/growth/growth.module';
import { DiscoverModule } from './modules/discover/discover.module';
import { UploadModule } from './modules/upload/upload.module';
import { SmsModule } from './modules/sms/sms.module';
import { AccountModule } from './modules/account/account.module';
import { LifeSpacesModule } from './modules/life-spaces/life-spaces.module';
import { AiGreetingsModule } from './modules/ai-greetings/ai-greetings.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'admin-dist'),
      serveRoot: '/admin',
      exclude: ['/api*', '/uploads*'],
    }),
    PrismaModule,
    SmsModule,
    AiModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    StatisticsModule,
    BudgetsModule,
    SavingGoalsModule,
    WealthModule,
    MembershipModule,
    PaymentModule,
    SharedBookModule,
    GrowthModule,
    DiscoverModule,
    UploadModule,
    AccountModule,
    LifeSpacesModule,
    AiGreetingsModule,
    AdminModule,
    AnnouncementsModule,
  ]
})
export class AppModule {}
