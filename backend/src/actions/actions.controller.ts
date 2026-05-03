import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly service: ActionsService) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  async list(@Query('campaignId') campaignId: string) {
    return this.service.list(campaignId);
  }

  @Post(':id/resolve')
  async resolve(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.service.resolve(id, user.userId, dto);
  }

  @Post(':id/attach-check')
  async attachCheck(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: { rollRecordId: string },
  ) {
    return this.service.attachCheck(id, user.userId, dto.rollRecordId);
  }
}
