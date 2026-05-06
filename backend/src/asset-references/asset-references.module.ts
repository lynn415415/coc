import { Module } from '@nestjs/common';
import { AssetReferencesController } from './asset-references.controller';
import { AssetReferencesService } from './asset-references.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssetReferencesController],
  providers: [AssetReferencesService],
})
export class AssetReferencesModule {}
