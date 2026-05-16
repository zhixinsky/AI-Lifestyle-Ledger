import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { LifeSpacesModule } from '../life-spaces/life-spaces.module';
import { DataManagementController } from './data-management.controller';
import { DataManagementService } from './data-management.service';

@Module({
  imports: [CategoriesModule, LifeSpacesModule],
  controllers: [DataManagementController],
  providers: [DataManagementService],
  exports: [DataManagementService],
})
export class DataManagementModule {}
