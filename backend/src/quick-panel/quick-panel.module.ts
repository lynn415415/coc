import { Module } from '@nestjs/common';
import { QuickPanelController } from './quick-panel.controller';
import { QuickPanelService } from './quick-panel.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickPanelController],
  providers: [QuickPanelService],
  exports: [QuickPanelService],
})
export class QuickPanelModule {}
