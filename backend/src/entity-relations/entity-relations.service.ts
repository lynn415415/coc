import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntityRelationsService {
  constructor(private prisma: PrismaService) {}

  async list(campaignId: string) {
    return this.prisma.entityRelation.findMany({ where: { campaignId } });
  }

  async create(campaignId: string, dto: { sourceId: string; targetId: string; relationType: string }) {
    return this.prisma.entityRelation.create({
      data: {
        campaignId,
        sourceId: dto.sourceId,
        targetId: dto.targetId,
        relationType: dto.relationType,
      },
    });
  }

  async update(id: string, dto: { relationType?: string; sourceId?: string; targetId?: string }) {
    return this.prisma.entityRelation.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return this.prisma.entityRelation.delete({ where: { id } });
  }

  async findByEntity(entityId: string) {
    const outgoing = await this.prisma.entityRelation.findMany({ where: { sourceId: entityId } });
    const incoming = await this.prisma.entityRelation.findMany({ where: { targetId: entityId } });
    return { outgoing, incoming };
  }
}
