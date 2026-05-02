import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
