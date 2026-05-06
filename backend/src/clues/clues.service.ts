import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CluesService {
  constructor(private prisma: PrismaService) {}

  async list(campaignId: string, userId: string, sceneId?: string) {
    const where: any = { campaignId };
    if (sceneId) where.sceneId = sceneId;

    // 检查是否是KP
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    const isKp = campaign?.kpId === userId;

    const clues = await this.prisma.clue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // KP可以看到所有线索
    if (isKp) return clues;

    return clues.filter((c) => {
      if (c.createdBy === userId) return true;
      if (c.privacy === 'public' || c.privacy === 'shared') return true;
      if (c.privacy === 'specific_user' && c.sharedWith) {
        return (c.sharedWith as string[]).includes(userId);
      }
      return false;
    });
  }

  async create(campaignId: string, userId: string, dto: {
    title: string;
    content: string;
    entityType?: string;
    privacy?: string;
    sharedWith?: string[];
    sceneId?: string;
    triggerCondition?: string;
    mapPosition?: { x: number; y: number };
    metadata?: any;
  }) {
    return this.prisma.clue.create({
      data: {
        campaignId,
        createdBy: userId,
        title: dto.title,
        content: dto.content,
        entityType: dto.entityType || 'clue',
        privacy: dto.privacy || 'private',
        sharedWith: dto.sharedWith ?? undefined,
        sceneId: dto.sceneId ?? undefined,
        triggerCondition: dto.triggerCondition ?? undefined,
        mapPosition: dto.mapPosition ?? undefined,
        metadata: dto.metadata ?? undefined,
      },
    });
  }

  async update(id: string, userId: string, dto: any) {
    const clue = await this.prisma.clue.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!clue) throw new NotFoundException('线索不存在');
    // KP可以编辑所有线索，普通成员只能编辑自己创建的
    if (clue.campaign.kpId !== userId && clue.createdBy !== userId) {
      throw new ForbiddenException('只能编辑自己创建的线索');
    }

    const data: any = {};
    const fields = ['title', 'content', 'entityType', 'privacy', 'sharedWith', 'sceneId', 'triggerCondition', 'mapPosition', 'metadata'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    return this.prisma.clue.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const clue = await this.prisma.clue.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!clue) throw new NotFoundException('线索不存在');
    // KP可以删除所有线索，普通成员只能删除自己创建的
    if (clue.campaign.kpId !== userId && clue.createdBy !== userId) {
      throw new ForbiddenException('只能删除自己创建的线索');
    }

    return this.prisma.clue.delete({ where: { id } });
  }

  async share(clueId: string, targetUserId: string, userId: string) {
    const clue = await this.prisma.clue.findUnique({ where: { id: clueId } });
    if (!clue) throw new NotFoundException('线索不存在');
    if (clue.createdBy !== userId) throw new ForbiddenException('只能分享自己创建的线索');

    const sharedWith: string[] = (clue.sharedWith as string[]) || [];
    if (!sharedWith.includes(targetUserId)) {
      sharedWith.push(targetUserId);
    }

    return this.prisma.clue.update({
      where: { id: clueId },
      data: { sharedWith, privacy: 'specific_user' },
    });
  }
}
