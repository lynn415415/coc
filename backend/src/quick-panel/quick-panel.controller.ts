import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QuickPanelService } from './quick-panel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('campaigns/:campaignId/quick-panel')
@UseGuards(JwtAuthGuard)
export class QuickPanelController {
  constructor(private readonly service: QuickPanelService) {}

  @Get()
  async get(
    @CurrentUser() user: { userId: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.service.get(user.userId, campaignId);
  }

  @Post()
  async save(
    @CurrentUser() user: { userId: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: { slots: any[] },
  ) {
    return this.service.save(user.userId, campaignId, dto.slots || []);
  }
}
