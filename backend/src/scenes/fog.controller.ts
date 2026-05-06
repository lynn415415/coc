import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { FogService } from './fog.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('scenes/:sceneId/fog')
@UseGuards(JwtAuthGuard)
export class FogController {
  constructor(private service: FogService) {}

  @Get()
  async get(@Param('sceneId') sceneId: string) {
    return this.service.get(sceneId);
  }

  @Put()
  async save(@Param('sceneId') sceneId: string, @Body() dto: { gmPaths?: any; revealedRegions?: any }) {
    return this.service.save(sceneId, dto);
  }
}
