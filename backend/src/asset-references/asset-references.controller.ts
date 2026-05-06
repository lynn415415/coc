import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AssetReferencesService } from './asset-references.service';

@Controller('asset-references')
export class AssetReferencesController {
  constructor(private readonly service: AssetReferencesService) {}

  @Get()
  async list(@Query('era') era?: string) {
    return this.service.list(era);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }

  @Post()
  async create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
