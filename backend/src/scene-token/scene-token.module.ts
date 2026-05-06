import { Module } from '@nestjs/common';
import { SceneTokenService } from './scene-token.service';
import { SceneTokenController } from './scene-token.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SceneTokenService],
  controllers: [SceneTokenController],
  exports: [SceneTokenService],
})
export class SceneTokenModule {}
