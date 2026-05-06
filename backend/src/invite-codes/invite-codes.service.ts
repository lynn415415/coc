import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InviteCodesService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code, isActive: true },
    });
    if (!invite) throw new NotFoundException('邀请码无效');
    if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
      throw new NotFoundException('邀请码已用完');
    }
    return { id: invite.id, welcomeMsg: invite.welcomeMsg, imageUrl: invite.imageUrl };
  }

  async useCode(id: string) {
    await this.prisma.inviteCode.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
  }

  async getWelcomeInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { inviteCode: true },
    });
    if (!user?.inviteCode) return null;
    return {
      welcomeMsg: user.inviteCode.welcomeMsg,
      imageUrl: user.inviteCode.imageUrl,
    };
  }
}
