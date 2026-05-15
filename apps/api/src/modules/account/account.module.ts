import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [EmailModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
