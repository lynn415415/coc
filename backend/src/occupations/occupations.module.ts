import { Module } from '@nestjs/common';
import { OccupationsController } from './occupations.controller';
import { OccupationsService } from './occupations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OccupationsController],
  providers: [OccupationsService],
})
export class OccupationsModule {}
