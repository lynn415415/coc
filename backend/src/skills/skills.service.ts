import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async list(category?: string, search?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }
}
