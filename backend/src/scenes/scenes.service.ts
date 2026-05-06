import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScenesService {
  constructor(private prisma: PrismaService) {}

  async create(campaignId: string, userId: string, dto: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== userId) throw new ForbiddenException('只有KP可以创建场景');

    const maxOrder = await this.prisma.scene.aggregate({
      where: { campaignId },
      _max: { sortOrder: true },
    });

    return this.prisma.scene.create({
      data: {
        campaignId,
        name: dto.name,
        description: dto.description,
        backgroundImage: dto.backgroundImage,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async get(sceneId: string) {
    const scene = await this.prisma.scene.findUnique({ where: { id: sceneId } });
    if (!scene) throw new NotFoundException('场景不存在');
    return scene;
  }

  async list(campaignId: string) {
    return this.prisma.scene.findMany({
      where: { campaignId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(sceneId: string, userId: string, dto: any) {
    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
      include: { campaign: true },
    });
    if (!scene) throw new NotFoundException('场景不存在');
    if (scene.campaign.kpId !== userId) throw new ForbiddenException('只有KP可以修改场景');

    const data: any = {};
    const fields = ['name', 'description', 'backgroundImage', 'sortOrder'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    return this.prisma.scene.update({ where: { id: sceneId }, data });
  }

  async delete(sceneId: string, userId: string) {
    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
      include: { campaign: true },
    });
    if (!scene) throw new NotFoundException('场景不存在');
    if (scene.campaign.kpId !== userId) throw new ForbiddenException('只有KP可以删除场景');

    await this.prisma.scene.delete({ where: { id: sceneId } });
    return { success: true };
  }

  async switchScene(campaignId: string, sceneId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('跑团不存在');
    if (campaign.kpId !== userId) throw new ForbiddenException('只有KP可以切换场景');

    const scene = await this.prisma.scene.findUnique({ where: { id: sceneId } });
    if (!scene || scene.campaignId !== campaignId) throw new NotFoundException('场景不存在或不在该跑团');

    await this.prisma.scene.updateMany({
      where: { campaignId },
      data: { isActive: false },
    });
    await this.prisma.scene.update({
      where: { id: sceneId },
      data: { isActive: true },
    });

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { currentSceneId: sceneId },
    });
  }
}
