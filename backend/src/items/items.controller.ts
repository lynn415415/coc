import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('investigators/:investigatorId/items/:itemId')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Post('use')
  async use(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.useItem(investigatorId, itemId, user.userId);
  }

  @Post('give')
  async give(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
    @Body() dto: { targetInvestigatorId: string },
  ) {
    return this.service.giveItem(investigatorId, itemId, user.userId, dto.targetInvestigatorId);
  }

  @Post('discard')
  async discard(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.discardItem(investigatorId, itemId, user.userId);
  }

  @Post('equip')
  async equip(
    @CurrentUser() user: { userId: string },
    @Param('investigatorId') investigatorId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.equipItem(investigatorId, itemId, user.userId);
  }
}
