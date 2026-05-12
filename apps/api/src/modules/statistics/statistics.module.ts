import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [CategoriesModule],
  controllers: [StatisticsController],
  providers: [StatisticsService]
})
export class StatisticsModule {}
