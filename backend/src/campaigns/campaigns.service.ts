import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const campaign = await this.prisma.campaign.create({
      data: {
        kpId: userId,
        title: dto.title,
        description: dto.description,
        maxPlayers: dto.maxPlayers ?? 4,
        era: dto.era,
        rollMethod: dto.rollMethod ?? 'DICE',
        pointBuyTotal: dto.pointBuyTotal,
        customRules: dto.customRules,
        isPublic: dto.isPublic ?? true,
      },
    });
    return this.getById(campaign.id);
  }

  async list(userId: string) {
    const [hosted, joined] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { kpId: userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { members: true } },
          kp: { select: { id: true, username: true, nickname: true } },
        },
      }),
      this.prisma.campaign.findMany({
        where: { members: { some: { userId, status: 'APPROVED' } } },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { members: true } },
          kp: { select: { id: true, username: true, nickname: true } },
        },
      }),
    ]);
    return { hosted, joined };
  }

  async getById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        kp: { select: { id: true, username: true, nickname: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, nickname: true } },
            investigator: {
              select: { id: true, name: true, era: true, hp: true, maxHp: true, san: true, maxSan: true, status: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        scenes: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!campaign) throw new NotFoundException('跑团不存在');
    return campaign;
  }

  async update(id: string, userId: string, dto: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== userId) throw new ForbiddenException('只有KP可以修改跑团');

    const data: any = {};
    const fields = ['title', 'description', 'maxPlayers', 'era', 'rollMethod', 'pointBuyTotal', 'customRules', 'isPublic', 'aiEnabled'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    return this.prisma.campaign.update({ where: { id }, data });
  }

  async join(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId === userId) throw new BadRequestException('你是KP，已自动加入');

    const existing = await this.prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (existing) throw new BadRequestException('已申请或已加入该跑团');

    const approvedCount = await this.prisma.campaignMember.count({
      where: { campaignId, status: 'APPROVED' },
    });
    if (approvedCount >= campaign.maxPlayers) throw new BadRequestException('跑团人数已满');

    return this.prisma.campaignMember.create({
      data: { campaignId, userId, status: 'PENDING' },
    });
  }

  async approveMember(campaignId: string, userId: string, kpId: string, targetUserId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== kpId) throw new ForbiddenException('只有KP可以审核成员');

    const member = await this.prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('成员不存在');
    if (member.status !== 'PENDING') throw new BadRequestException('该成员已处理');

    const approvedCount = await this.prisma.campaignMember.count({
      where: { campaignId, status: 'APPROVED' },
    });
    if (approvedCount >= campaign.maxPlayers) throw new BadRequestException('跑团人数已满');

    return this.prisma.campaignMember.update({
      where: { campaignId_userId: { campaignId, userId: targetUserId } },
      data: { status: 'APPROVED' },
    });
  }

  async kickMember(campaignId: string, kpId: string, targetUserId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== kpId) throw new ForbiddenException('只有KP可以移除成员');

    const member = await this.prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('成员不存在');

    await this.prisma.campaignMember.delete({
      where: { campaignId_userId: { campaignId, userId: targetUserId } },
    });
    return { success: true };
  }

  async bindInvestigator(campaignId: string, userId: string, investigatorId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');

    const member = await this.prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (!member) throw new BadRequestException('你不是该跑团成员');

    const inv = await this.prisma.investigator.findUnique({ where: { id: investigatorId } });
    if (!inv) throw new NotFoundException('角色卡不存在');
    if (inv.userId !== userId) throw new ForbiddenException('只能绑定自己的角色卡');
    if (inv.status !== 'APPROVED') throw new BadRequestException('角色卡未通过审核');

    return this.prisma.campaignMember.update({
      where: { campaignId_userId: { campaignId, userId } },
      data: { investigatorId },
    });
  }

  async start(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== userId) throw new ForbiddenException('只有KP可以开始跑团');
    if (campaign.sessionStatus === 'IN_SESSION') throw new BadRequestException('跑团已开始');

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { sessionStatus: 'IN_SESSION', status: 'ONGOING' },
    });
  }

  async end(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== userId) throw new ForbiddenException('只有KP可以结束跑团');
    if (campaign.sessionStatus !== 'IN_SESSION') throw new BadRequestException('跑团未开始');

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { sessionStatus: 'IDLE', status: 'FINISHED' },
    });
  }
}
