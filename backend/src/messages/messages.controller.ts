import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('campaigns/:campaignId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  async list(
    @Param('campaignId') campaignId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(campaignId, cursor, limit ? parseInt(limit) : 50);
  }

  @Post('system')
  async createSystem(
    @Param('campaignId') campaignId: string,
    @Body() dto: { content: string; metadata?: any },
  ) {
    return this.service.createSystemMessage(campaignId, dto.content, dto.metadata);
  }
}
