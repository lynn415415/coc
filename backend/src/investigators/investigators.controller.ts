import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvestigatorsService } from './investigators.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('investigators')
@UseGuards(JwtAuthGuard)
export class InvestigatorsController {
  constructor(private readonly service: InvestigatorsService) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }, @Query('status') status?: string) {
    return this.service.list(user.userId, status);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  @Post(':id/calculate')
  async calculate(@Param('id') id: string) {
    return this.service.calculateDerived(id);
  }
}
