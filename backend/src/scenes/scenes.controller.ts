import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScenesService } from './scenes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ScenesController {
  constructor(private readonly service: ScenesService) {}

  @Post('campaigns/:campaignId/scenes')
  async create(
    @CurrentUser() user: { userId: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: any,
  ) {
    return this.service.create(campaignId, user.userId, dto);
  }

  @Get('campaigns/:campaignId/scenes')
  async list(@Param('campaignId') campaignId: string) {
    return this.service.list(campaignId);
  }

  @Patch('scenes/:sceneId')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('sceneId') sceneId: string,
    @Body() dto: any,
  ) {
    return this.service.update(sceneId, user.userId, dto);
  }

  @Delete('scenes/:sceneId')
  async delete(
    @CurrentUser() user: { userId: string },
    @Param('sceneId') sceneId: string,
  ) {
    return this.service.delete(sceneId, user.userId);
  }

  @Get('scenes/:sceneId')
  async get(@Param('sceneId') sceneId: string) {
    return this.service.get(sceneId);
  }

  @Post('campaigns/:campaignId/switch-scene/:sceneId')
  async switchScene(
    @CurrentUser() user: { userId: string },
    @Param('campaignId') campaignId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.service.switchScene(campaignId, sceneId, user.userId);
  }
}
