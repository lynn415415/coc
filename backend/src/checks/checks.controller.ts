import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('checks')
@UseGuards(JwtAuthGuard)
export class ChecksController {
  constructor(private readonly service: ChecksService) {}

  @Post('skill')
  async skillCheck(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.skillCheck({ ...dto, userId: user.userId });
  }

  @Post('san')
  async sanCheck(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.sanCheck({ ...dto, userId: user.userId });
  }

  @Post('luck')
  async luckCheck(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.luckCheck({ ...dto, userId: user.userId });
  }

  @Get()
  async list(
    @Query('campaignId') campaignId?: string,
    @Query('investigatorId') investigatorId?: string,
  ) {
    return this.service.list(campaignId, investigatorId);
  }
}
