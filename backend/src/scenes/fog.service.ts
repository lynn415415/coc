import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FogService {
  constructor(private prisma: PrismaService) {}

  async get(sceneId: string) {
    const fog = await this.prisma.fogData.findUnique({ where: { sceneId } });
    return fog || { sceneId, gmPaths: [], revealedRegions: [] };
  }

  async save(sceneId: string, dto: { gmPaths?: any; revealedRegions?: any }) {
    return this.prisma.fogData.upsert({
      where: { sceneId },
      create: {
        sceneId,
        gmPaths: dto.gmPaths ?? [],
        revealedRegions: dto.revealedRegions ?? [],
      },
      update: {
        gmPaths: dto.gmPaths,
        revealedRegions: dto.revealedRegions,
      },
    });
  }
}
