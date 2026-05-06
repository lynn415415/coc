import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async list(investigatorId: string) {
    return this.prisma.investigatorItem.findMany({
      where: { investigatorId },
      include: { weapon: true, armor: true },
      orderBy: { location: 'asc' },
    });
  }

  async create(investigatorId: string, dto: { customName?: string; location?: string; quantity?: number; description?: string; weaponId?: number; armorId?: number; itemTemplateId?: number }) {
    return this.prisma.investigatorItem.create({
      data: {
        investigatorId,
        customName: dto.customName,
        location: dto.location || 'storage',
        quantity: dto.quantity || 1,
        description: dto.description,
        weaponId: dto.weaponId,
        armorId: dto.armorId,
        itemTemplateId: dto.itemTemplateId,
      },
    });
  }

  async findOne(investigatorId: string, itemId: string) {
    const item = await this.prisma.investigatorItem.findUnique({
      where: { id: itemId, investigatorId },
      include: { weapon: true, armor: true },
    });
    if (!item) throw new NotFoundException('物品不存在');
    return item;
  }

  async useItem(investigatorId: string, itemId: string, userId: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id: investigatorId } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.userId !== userId) throw new ForbiddenException('只能操作自己的物品');

    const item = await this.prisma.investigatorItem.findUnique({
      where: { id: itemId, investigatorId },
    });
    if (!item) throw new NotFoundException('物品不存在');

    if (item.quantity > 1) {
      return this.prisma.investigatorItem.update({
        where: { id: itemId },
        data: { quantity: { decrement: 1 } },
      });
    }

    await this.prisma.investigatorItem.delete({ where: { id: itemId } });
    return { success: true, consumed: true };
  }

  async giveItem(investigatorId: string, itemId: string, userId: string, targetInvestigatorId: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id: investigatorId } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.userId !== userId) throw new ForbiddenException('只能操作自己的物品');

    const item = await this.prisma.investigatorItem.findUnique({
      where: { id: itemId, investigatorId },
    });
    if (!item) throw new NotFoundException('物品不存在');

    const target = await this.prisma.investigator.findUnique({ where: { id: targetInvestigatorId } });
    if (!target) throw new NotFoundException('目标调查员不存在');

    if (item.quantity > 1) {
      await this.prisma.investigatorItem.update({
        where: { id: itemId },
        data: { quantity: { decrement: 1 } },
      });
      return this.prisma.investigatorItem.create({
        data: {
          investigatorId: targetInvestigatorId,
          itemTemplateId: item.itemTemplateId,
          weaponId: item.weaponId,
          armorId: item.armorId,
          customName: item.customName,
          location: item.location,
          quantity: 1,
          description: item.description,
        },
      });
    }

    return this.prisma.investigatorItem.update({
      where: { id: itemId },
      data: { investigatorId: targetInvestigatorId },
    });
  }

  async discardItem(investigatorId: string, itemId: string, userId: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id: investigatorId } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.userId !== userId) throw new ForbiddenException('只能操作自己的物品');

    const item = await this.prisma.investigatorItem.findUnique({
      where: { id: itemId, investigatorId },
    });
    if (!item) throw new NotFoundException('物品不存在');

    await this.prisma.investigatorItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  async equipItem(investigatorId: string, itemId: string, userId: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id: investigatorId } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.userId !== userId) throw new ForbiddenException('只能操作自己的物品');

    const item = await this.prisma.investigatorItem.findUnique({
      where: { id: itemId, investigatorId },
    });
    if (!item) throw new NotFoundException('物品不存在');

    const newLocation = item.location === 'hand' ? 'storage' : 'hand';
    return this.prisma.investigatorItem.update({
      where: { id: itemId },
      data: { location: newLocation },
    });
  }
}
