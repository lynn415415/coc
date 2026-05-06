import { Module } from '@nestjs/common';
import { CluesService } from './clues.service';
import { CluesController } from './clues.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CluesService],
  controllers: [CluesController],
  exports: [CluesService],
})
export class CluesModule {}
