import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('invite-codes')
export class InviteCodesController {
  constructor(private readonly service: InviteCodesService) {}

  @Post('validate')
  async validate(@Body('code') code: string) {
    return this.service.validate(code);
  }

  @Get('welcome')
  @UseGuards(JwtAuthGuard)
  async getWelcome(@CurrentUser() user: { userId: string }) {
    return this.service.getWelcomeInfo(user.userId);
  }
}
