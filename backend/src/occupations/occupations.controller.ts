import { Controller, Get, Param } from '@nestjs/common';
import { OccupationsService } from './occupations.service';

@Controller('occupations')
export class OccupationsController {
  constructor(private readonly service: OccupationsService) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }
}
