import { Module } from '@nestjs/common';
import { QuickPanelController } from './quick-panel.controller';
import { QuickPanelService } from './quick-panel.service';

@Module({
  controllers: [QuickPanelController],
  providers: [QuickPanelService],
  exports: [QuickPanelService],
})
export class QuickPanelModule {}
