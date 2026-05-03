import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiceService } from '../dice/dice.service';

@Injectable()
export class ChecksService {
  constructor(
    private prisma: PrismaService,
    private dice: DiceService,
  ) {}

  async skillCheck(dto: any) {
    const result = this.dice.skillCheck(
      dto.targetValue,
      dto.bonusDice || 0,
      dto.penaltyDice || 0,
      dto.luckSpent || 0,
    );

    const record = await this.prisma.rollRecord.create({
      data: {
        campaignId: dto.campaignId,
        investigatorId: dto.investigatorId,
        userId: dto.userId,
        rollType: 'SKILL',
        skillName: dto.skillName,
        targetValue: dto.targetValue,
        rollResult: result.roll,
        successLevel: result.successLevel,
        bonusDice: dto.bonusDice || 0,
        penaltyDice: dto.penaltyDice || 0,
        metadata: JSON.stringify({ description: result.description }),
      },
    });

    return { ...result, recordId: record.id };
  }

  async sanCheck(dto: any) {
    const result = this.dice.sanCheck(dto.currentSan, dto.loss || '1d6');

    const record = await this.prisma.rollRecord.create({
      data: {
        campaignId: dto.campaignId,
        investigatorId: dto.investigatorId,
        userId: dto.userId,
        rollType: 'SAN',
        targetValue: dto.currentSan,
        rollResult: result.roll,
        successLevel: result.successLevel,
        metadata: JSON.stringify({ description: result.description, sanLoss: (result as any).sanLoss }),
      },
    });

    return { ...result, recordId: record.id, sanLoss: (result as any).sanLoss };
  }

  async luckCheck(dto: any) {
    const result = this.dice.luckCheck(dto.luck);

    const record = await this.prisma.rollRecord.create({
      data: {
        campaignId: dto.campaignId,
        investigatorId: dto.investigatorId,
        userId: dto.userId,
        rollType: 'LUCK',
        targetValue: dto.luck,
        rollResult: result.roll,
        successLevel: result.successLevel,
        metadata: JSON.stringify({ description: result.description }),
      },
    });

    return { ...result, recordId: record.id };
  }

  async list(campaignId?: string, investigatorId?: string, limit = 50) {
    return this.prisma.rollRecord.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        ...(investigatorId ? { investigatorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
