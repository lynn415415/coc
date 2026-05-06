import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArmorsService {
  constructor(private prisma: PrismaService) {}

  async list(era?: string, category?: string, search?: string) {
    const where: any = {};
    if (era) where.era = era;
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.armor.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async getById(id: number) {
    return this.prisma.armor.findUnique({ where: { id } });
  }

  async create(dto: any) {
    return this.prisma.armor.create({ data: dto });
  }

  async update(id: number, dto: any) {
    return this.prisma.armor.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.armor.delete({ where: { id } });
  }
}
