import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_ROLES = ['PLAYER', 'KP', 'ADMIN'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, role?: string) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, nickname: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, nickname: true, email: true, avatarUrl: true, role: true, createdAt: true },
    });
  }

  async update(id: string, data: any) {
    const allowed = ['nickname', 'email', 'avatarUrl', 'bio'];
    const updateData: any = {};
    allowed.forEach((k) => { if (data[k] !== undefined) updateData[k] = data[k]; });
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, nickname: true, email: true, avatarUrl: true, role: true },
    });
  }

  async updateRole(id: string, role: string) {
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException(`无效角色，可选: ${VALID_ROLES.join(', ')}`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, nickname: true, email: true, role: true },
    });
  }

  async getKpUsers() {
    return this.prisma.user.findMany({
      where: { role: { in: ['KP', 'ADMIN'] } },
      select: { id: true, username: true, nickname: true, role: true },
      orderBy: { nickname: 'asc' },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true },
    });
  }
}
