import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { WeaponsService } from './weapons.service';

@Controller('weapons')
export class WeaponsController {
  constructor(private readonly service: WeaponsService) {}

  @Get()
  async list(@Query('era') era?: string, @Query('category') category?: string, @Query('search') search?: string) {
    return this.service.list(era, category, search);
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
