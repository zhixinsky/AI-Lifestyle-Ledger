import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedBookService } from './shared-book.service';
import { SharedBookController } from './shared-book.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SharedBookController],
  providers: [SharedBookService],
  exports: [SharedBookService],
})
export class SharedBookModule {}
