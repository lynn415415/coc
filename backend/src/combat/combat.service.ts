import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';

@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(private prisma: PrismaService) {}

  async startCombat(campaignId: string, investigatorIds: string[], npcs: { name: string; initiative?: number; dex?: number; hp?: number; maxHp?: number; san?: number; maxSan?: number; mp?: number; maxMp?: number }[] = []) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.combatRound.findFirst({
        where: { campaignId, status: 'ACTIVE' },
      });
      if (existing) {
        throw new Error('当前已有进行中的战斗轮，请先结束');
      }

      const combatants: any[] = [];

      for (const invId of investigatorIds) {
        const inv = await tx.investigator.findUnique({ where: { id: invId } });
        if (!inv) continue;
        combatants.push({
          investigatorId: inv.id,
          name: inv.name,
          initiative: inv.dex || 50,
          initiativeRoll: 0,
          hp: inv.hp,
          maxHp: inv.maxHp,
          san: inv.san,
          maxSan: inv.maxSan,
          mp: inv.mp,
          maxMp: inv.maxMp,
          isNpc: false,
          sortOrder: 0,
        });
      }

      for (const npc of npcs) {
        combatants.push({
          investigatorId: null,
          name: npc.name,
          initiative: npc.initiative ?? npc.dex ?? 10,
          initiativeRoll: 0,
          hp: npc.hp ?? 10,
          maxHp: npc.maxHp ?? npc.hp ?? 10,
          san: npc.san ?? null,
          maxSan: npc.maxSan ?? null,
          mp: npc.mp ?? null,
          maxMp: npc.maxMp ?? null,
          isNpc: true,
          sortOrder: 0,
        });
      }

      combatants.forEach((c) => {
        if (this.countSameDex(combatants, c.initiative) > 1) {
          c.initiativeRoll = Math.floor(Math.random() * 100) + 1;
        }
      });

      combatants.sort((a, b) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.initiativeRoll - a.initiativeRoll;
      });

      combatants.forEach((c, i) => (c.sortOrder = i));

      return tx.combatRound.create({
        data: {
          campaignId,
          roundNumber: 1,
          turnIndex: 0,
          status: 'ACTIVE',
          combatants: { create: combatants },
        },
        include: { combatants: { include: { conditions: true } } },
      });
    });
  }

  private countSameDex(combatants: any[], dex: number): number {
    return combatants.filter((c) => c.initiative === dex).length;
  }

  async getActiveCombat(campaignId: string) {
    return this.prisma.combatRound.findFirst({
      where: { campaignId, status: 'ACTIVE' },
      include: { combatants: { include: { conditions: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async nextTurn(campaignId: string) {
    const combat = await this.getActiveCombat(campaignId);
    if (!combat) throw new Error('当前没有进行中的战斗');

    const nextIndex = combat.turnIndex + 1;
    if (nextIndex >= combat.combatants.length) {
      // 下一回合
      return this.prisma.combatRound.update({
        where: { id: combat.id },
        data: { turnIndex: 0, roundNumber: combat.roundNumber + 1 },
        include: { combatants: { include: { conditions: true }, orderBy: { sortOrder: 'asc' } } },
      });
    }

    return this.prisma.combatRound.update({
      where: { id: combat.id },
      data: { turnIndex: nextIndex },
      include: { combatants: { include: { conditions: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async endCombat(campaignId: string) {
    const combat = await this.getActiveCombat(campaignId);
    if (!combat) throw new Error('当前没有进行中的战斗');

    return this.prisma.combatRound.update({
      where: { id: combat.id },
      data: { status: 'ENDED', endedAt: new Date() },
      include: { combatants: true },
    });
  }

  async updateCombatantHp(combatantId: string, hp: number) {
    return this.prisma.combatant.update({
      where: { id: combatantId },
      data: { hp },
    });
  }

  async updateCombatantSan(combatantId: string, san: number) {
    return this.prisma.combatant.update({
      where: { id: combatantId },
      data: { san },
    });
  }

  async updateCombatantMp(combatantId: string, mp: number) {
    return this.prisma.combatant.update({
      where: { id: combatantId },
      data: { mp },
    });
  }

  async addCondition(combatantId: string, name: string, description?: string, roundsRemaining?: number, modifier?: number) {
    return this.prisma.condition.create({
      data: { combatantId, name, description, roundsRemaining, modifier },
    });
  }

  async removeCondition(conditionId: string) {
    return this.prisma.condition.delete({ where: { id: conditionId } });
  }

  async tickConditions(campaignId: string): Promise<{ expired: string[] }> {
    const combat = await this.getActiveCombat(campaignId);
    if (!combat) return { expired: [] };

    const expired: string[] = [];
    for (const c of combat.combatants) {
      for (const cond of c.conditions) {
        if (cond.roundsRemaining != null && cond.roundsRemaining > 0) {
          const remaining = cond.roundsRemaining - 1;
          if (remaining <= 0) {
            await this.prisma.condition.delete({ where: { id: cond.id } });
            expired.push(cond.name);
          } else {
            await this.prisma.condition.update({
              where: { id: cond.id },
              data: { roundsRemaining: remaining },
            });
          }
        }
      }
    }
    return { expired };
  }
}
