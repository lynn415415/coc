import { Module } from '@nestjs/common';
import { ArmorsController } from './armors.controller';
import { ArmorsService } from './armors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArmorsController],
  providers: [ArmorsService],
})
export class ArmorsModule {}
