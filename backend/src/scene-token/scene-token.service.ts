import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SceneTokenService {
  constructor(private prisma: PrismaService) {}

  async list(sceneId: string) {
    return this.prisma.sceneToken.findMany({
      where: { sceneId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(sceneId: string, dto: {
    name: string;
    imageUrl?: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    faction?: string;
    isHidden?: boolean;
    labels?: any;
    linkedInvestigatorId?: string;
  }) {
    return this.prisma.sceneToken.create({
      data: {
        sceneId,
        name: dto.name,
        imageUrl: dto.imageUrl,
        x: dto.x,
        y: dto.y,
        width: dto.width ?? 40,
        height: dto.height ?? 40,
        rotation: dto.rotation ?? 0,
        faction: dto.faction ?? 'neutral',
        isHidden: dto.isHidden ?? false,
        labels: dto.labels,
        linkedInvestigatorId: dto.linkedInvestigatorId,
      },
    });
  }

  async update(id: string, dto: {
    name?: string;
    imageUrl?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    faction?: string;
    isHidden?: boolean;
    labels?: any;
  }) {
    const token = await this.prisma.sceneToken.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token不存在');

    const data: any = {};
    const fields: (keyof typeof dto)[] = ['name', 'imageUrl', 'x', 'y', 'width', 'height', 'rotation', 'faction', 'isHidden', 'labels'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    return this.prisma.sceneToken.update({ where: { id }, data });
  }

  async delete(id: string) {
    const token = await this.prisma.sceneToken.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token不存在');
    return this.prisma.sceneToken.delete({ where: { id } });
  }

  async batchUpdate(updates: { id: string; x: number; y: number; rotation?: number }[]) {
    const results = [];
    for (const u of updates) {
      const data: any = { x: u.x, y: u.y };
      if (u.rotation !== undefined) data.rotation = u.rotation;
      results.push(this.prisma.sceneToken.update({ where: { id: u.id }, data }));
    }
    return Promise.all(results);
  }
}
