import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LifeSpacesController } from './life-spaces.controller';
import { LifeSpacesService } from './life-spaces.service';

@Module({
  imports: [PrismaModule],
  controllers: [LifeSpacesController],
  providers: [LifeSpacesService],
  exports: [LifeSpacesService],
})
export class LifeSpacesModule {}
