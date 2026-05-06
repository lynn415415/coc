import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SceneTokenService } from './scene-token.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('scenes/:sceneId/tokens')
@UseGuards(JwtAuthGuard)
export class SceneTokenController {
  constructor(private service: SceneTokenService) {}

  @Get()
  async list(@Param('sceneId') sceneId: string) {
    return this.service.list(sceneId);
  }

  @Post()
  async create(@Param('sceneId') sceneId: string, @Body() dto: any) {
    return this.service.create(sceneId, dto);
  }

  @Patch('batch')
  async batchUpdate(@Body() dto: { updates: { id: string; x: number; y: number; rotation?: number }[] }) {
    return this.service.batchUpdate(dto.updates || []);
  }

  @Patch(':tokenId')
  async update(@Param('tokenId') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':tokenId')
  async delete(@Param('tokenId') id: string) {
    return this.service.delete(id);
  }
}
