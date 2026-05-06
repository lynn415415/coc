import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { EntityRelationsService } from './entity-relations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('campaigns/:campaignId/relations')
@UseGuards(JwtAuthGuard)
export class EntityRelationsController {
  constructor(private service: EntityRelationsService) {}

  @Get()
  async list(@Param('campaignId') campaignId: string) {
    return this.service.list(campaignId);
  }

  @Post()
  async create(@Param('campaignId') campaignId: string, @Body() dto: any) {
    return this.service.create(campaignId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: { relationType?: string; sourceId?: string; targetId?: string }) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get('entity/:entityId')
  async findByEntity(@Param('entityId') entityId: string) {
    return this.service.findByEntity(entityId);
  }
}
