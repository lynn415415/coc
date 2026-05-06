import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MessageMetadata } from '../common/types/message.types';

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
      metadata: m.metadata ?? undefined,
    }));
  }

  async createSystemMessage(campaignId: string, content: string, metadata?: MessageMetadata) {
    return this.prisma.message.create({
      data: {
        campaignId,
        senderId: null,
        senderName: '系统',
        senderType: 'SYSTEM',
        content,
        messageType: 'SYSTEM',
        metadata: (metadata ?? undefined) as any,
      },
    });
  }

  async markEvent(
    messageId: string,
    campaignId: string,
    dto: { eventTitle?: string; eventTime?: string; eventType?: string },
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new Error('消息不存在');
    if (message.campaignId !== campaignId) throw new Error('消息不属于该战役');

    const metadata = (message.metadata ?? {}) as Record<string, unknown>;
    metadata.isEvent = true;
    if (dto.eventTitle) metadata.eventTitle = dto.eventTitle;
    if (dto.eventTime) metadata.eventTime = dto.eventTime;
    if (dto.eventType) metadata.eventType = dto.eventType;

    return this.prisma.message.update({
      where: { id: messageId },
      data: { metadata: metadata as any },
    });
  }

  async getTimeline(campaignId: string, sort: 'asc' | 'desc' = 'asc') {
    const messages = await this.prisma.message.findMany({
      where: { campaignId },
      orderBy: { createdAt: sort },
    });

    const events = messages.filter((m) => (m.metadata as any)?.isEvent === true);

    return events.map((m) => ({
      id: m.id,
      title: (m.metadata as any)?.eventTitle || m.content.slice(0, 50),
      content: m.content,
      senderName: m.senderName,
      senderType: m.senderType,
      eventType: (m.metadata as any)?.eventType || '通用',
      eventTime: (m.metadata as any)?.eventTime || m.createdAt.toISOString(),
      realTime: m.createdAt.toISOString(),
      messageType: m.messageType,
    }));
  }

  async exportMarkdown(campaignId: string, sort: 'asc' | 'desc' = 'asc', axis: 'script' | 'real' = 'real') {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { title: true },
    });

    const events = await this.getTimeline(campaignId, sort);

    const lines = [
      `# 战役复盘报告：${campaign?.title || campaignId}`,
      '',
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      `时间轴：${axis === 'script' ? '剧本时间' : '现实时间'}`,
      '',
      '---',
      '',
    ];

    events.forEach((ev, idx) => {
      const time = axis === 'script' ? ev.eventTime : ev.realTime;
      lines.push(`## ${idx + 1}. ${ev.title}`);
      lines.push('');
      lines.push(`- **类型**：${ev.eventType}`);
      lines.push(`- **时间**：${new Date(time).toLocaleString('zh-CN')}`);
      lines.push(`- **来源**：${ev.senderName}`);
      lines.push(`- **内容**：${ev.content}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    return { markdown: lines.join('\n'), eventCount: events.length };
  }
}
