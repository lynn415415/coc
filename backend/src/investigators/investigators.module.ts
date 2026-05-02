import { Module } from '@nestjs/common';
import { InvestigatorsController } from './investigators.controller';
import { InvestigatorsService } from './investigators.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestigatorsController],
  providers: [InvestigatorsService],
  exports: [InvestigatorsService],
})
export class InvestigatorsModule {}
