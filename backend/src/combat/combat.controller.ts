import { Controller, Get, Post, Delete, Param, Body, Patch, UseGuards } from '@nestjs/common';
import { CombatService } from './combat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(private combat: CombatService) {}

  @Get(':campaignId')
  async getActive(@Param('campaignId') campaignId: string) {
    return this.combat.getActiveCombat(campaignId) ?? { combatants: [] };
  }

  @Post(':campaignId/start')
  async start(@Param('campaignId') campaignId: string, @Body() body: { investigatorIds: string[]; npcs?: any[] }) {
    return this.combat.startCombat(campaignId, body.investigatorIds || [], body.npcs || []);
  }

  @Post(':campaignId/next-turn')
  async nextTurn(@Param('campaignId') campaignId: string) {
    return this.combat.nextTurn(campaignId);
  }

  @Post(':campaignId/end')
  async end(@Param('campaignId') campaignId: string) {
    return this.combat.endCombat(campaignId);
  }

  @Post(':campaignId/tick-conditions')
  async tickConditions(@Param('campaignId') campaignId: string) {
    return this.combat.tickConditions(campaignId);
  }

  @Patch('combatant/:id/hp')
  async updateHp(@Param('id') id: string, @Body('hp') hp: number) {
    return this.combat.updateCombatantHp(id, hp);
  }

  @Patch('combatant/:id/san')
  async updateSan(@Param('id') id: string, @Body('san') san: number) {
    return this.combat.updateCombatantSan(id, san);
  }

  @Patch('combatant/:id/mp')
  async updateMp(@Param('id') id: string, @Body('mp') mp: number) {
    return this.combat.updateCombatantMp(id, mp);
  }

  @Post('combatant/:id/condition')
  async addCondition(@Param('id') id: string, @Body() body: { name: string; description?: string; rounds?: number; modifier?: number }) {
    return this.combat.addCondition(id, body.name, body.description, body.rounds, body.modifier);
  }

  @Delete('condition/:id')
  async removeCondition(@Param('id') id: string) {
    return this.combat.removeCondition(id);
  }
}
