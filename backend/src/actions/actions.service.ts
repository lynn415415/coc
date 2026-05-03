import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.sessionStatus !== 'IN_SESSION') throw new BadRequestException('跑团未开始');

    return this.prisma.actionRecord.create({
      data: {
        campaignId: dto.campaignId,
        userId,
        investigatorId: dto.investigatorId,
        actionType: dto.actionType,
        targetId: dto.targetId,
        description: dto.description,
        status: 'PENDING',
      },
    });
  }

  async list(campaignId: string) {
    return this.prisma.actionRecord.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, nickname: true } },
        investigator: { select: { id: true, name: true } },
        rollRecord: true,
      },
    });
  }

  async resolve(id: string, userId: string, dto: any) {
    const action = await this.prisma.actionRecord.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!action) throw new NotFoundException('行动不存在');
    if (action.campaign.kpId !== userId) throw new ForbiddenException('只有KP可以裁定行动');
    if (action.status !== 'PENDING') throw new BadRequestException('行动已处理');

    return this.prisma.actionRecord.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedBy: userId,
      },
    });
  }

  async attachCheck(id: string, userId: string, rollRecordId: string) {
    const action = await this.prisma.actionRecord.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!action) throw new NotFoundException('行动不存在');
    if (action.campaign.kpId !== userId) throw new ForbiddenException('只有KP可以关联检定');

    return this.prisma.actionRecord.update({
      where: { id },
      data: { rollRecordId },
    });
  }
}
