import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, nickname: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.user.count(),
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

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true },
    });
  }
}
