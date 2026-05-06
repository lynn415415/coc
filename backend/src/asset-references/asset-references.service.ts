import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetReferencesService {
  constructor(private prisma: PrismaService) {}

  async list(era?: string) {
    const where: any = {};
    if (era) where.era = era;
    return this.prisma.assetReference.findMany({
      where,
      orderBy: [{ era: 'asc' }, { crMin: 'asc' }],
    });
  }

  async getById(id: number) {
    return this.prisma.assetReference.findUnique({ where: { id } });
  }

  async create(dto: any) {
    return this.prisma.assetReference.create({ data: dto });
  }

  async update(id: number, dto: any) {
    return this.prisma.assetReference.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.assetReference.delete({ where: { id } });
  }
}
