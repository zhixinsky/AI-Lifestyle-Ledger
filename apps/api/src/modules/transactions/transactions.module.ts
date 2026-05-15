import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { GrowthModule } from '../growth/growth.module';
import { LifeSpacesModule } from '../life-spaces/life-spaces.module';
import { WealthModule } from '../wealth/wealth.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [CategoriesModule, WealthModule, GrowthModule, LifeSpacesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
