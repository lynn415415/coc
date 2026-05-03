import { Module } from '@nestjs/common';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';
import { DiceService } from '../dice/dice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChecksController],
  providers: [ChecksService, DiceService],
  exports: [ChecksService],
})
export class ChecksModule {}
