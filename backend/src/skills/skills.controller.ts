import { Controller, Get, Query } from '@nestjs/common';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  async list(@Query('category') category?: string, @Query('search') search?: string) {
    return this.service.list(category, search);
  }
}
