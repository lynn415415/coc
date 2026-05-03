import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuickPanelService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string, campaignId: string) {
    const slots = await this.prisma.quickPanelSlot.findMany({
      where: { userId, campaignId },
      orderBy: { slotIndex: 'asc' },
    });
    return slots;
  }

  async save(userId: string, campaignId: string, slots: any[]) {
    await this.prisma.quickPanelSlot.deleteMany({
      where: { userId, campaignId },
    });

    if (!slots.length) return [];

    await this.prisma.quickPanelSlot.createMany({
      data: slots.map((s, idx) => ({
        userId,
        campaignId,
        slotIndex: idx,
        slotType: s.slotType,
        targetId: s.targetId,
        customLabel: s.customLabel,
        customValue: s.customValue,
      })),
    });

    return this.get(userId, campaignId);
  }
}
