import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async list(campaignId: string, cursor?: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    return messages.reverse().map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
    }));
  }

  async createSystemMessage(campaignId: string, content: string, metadata?: any) {
    return this.prisma.message.create({
      data: {
        campaignId,
        senderId: null,
        senderName: '系统',
        senderType: 'SYSTEM',
        content,
        messageType: 'SYSTEM',
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }
}
