import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CluesService } from './clues.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('campaigns/:campaignId/clues')
@UseGuards(JwtAuthGuard)
export class CluesController {
  constructor(private service: CluesService) {}

  @Get()
  async list(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: { userId: string },
    @Query('sceneId') sceneId?: string,
  ) {
    return this.service.list(campaignId, user.userId, sceneId);
  }

  @Post()
  async create(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: any,
  ) {
    return this.service.create(campaignId, user.userId, dto);
  }

  @Patch(':clueId')
  async update(
    @Param('clueId') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: any,
  ) {
    return this.service.update(id, user.userId, dto);
  }

  @Delete(':clueId')
  async delete(
    @Param('clueId') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.delete(id, user.userId);
  }

  @Post(':clueId/share')
  async share(
    @Param('clueId') clueId: string,
    @CurrentUser() user: { userId: string },
    @Body('userId') targetUserId: string,
  ) {
    return this.service.share(clueId, targetUserId, user.userId);
  }
}
