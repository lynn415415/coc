import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('investigators/:investigatorId/items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Get()
  async list(@Param('investigatorId') investigatorId: string) {
    return this.service.list(investigatorId);
  }

  @Post()
  async create(
    @Param('investigatorId') investigatorId: string,
    @Body() dto: { customName?: string; location?: string; quantity?: number; description?: string; weaponId?: number; armorId?: number; itemTemplateId?: number },
  ) {
    return this.service.create(investigatorId, dto);
  }

  @Get(':itemId')
  async findOne(
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.findOne(investigatorId, itemId);
  }

  @Post(':itemId/use')
  async use(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.useItem(investigatorId, itemId, user.userId);
  }

  @Post(':itemId/give')
  async give(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
    @Body() dto: { targetInvestigatorId: string },
  ) {
    return this.service.giveItem(investigatorId, itemId, user.userId, dto.targetInvestigatorId);
  }

  @Post(':itemId/discard')
  async discard(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.discardItem(investigatorId, itemId, user.userId);
  }

  @Post(':itemId/equip')
  async equip(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.equipItem(investigatorId, itemId, user.userId);
  }
}
