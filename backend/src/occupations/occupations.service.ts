import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OccupationsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.occupation.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true, name: true, era: true,
        creditMin: true, creditMax: true,
        pointFormula: true, skillIds: true,
        anyTalentCount: true, eraTalentCount: true,
      },
    });
  }

  async getById(id: number) {
    return this.prisma.occupation.findUnique({
      where: { id },
      include: { investigators: false },
    });
  }
}
