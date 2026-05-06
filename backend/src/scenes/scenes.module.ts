import { Module } from '@nestjs/common';
import { ScenesController } from './scenes.controller';
import { ScenesService } from './scenes.service';
import { FogController } from './fog.controller';
import { FogService } from './fog.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScenesController, FogController],
  providers: [ScenesService, FogService],
  exports: [ScenesService, FogService],
})
export class ScenesModule {}
