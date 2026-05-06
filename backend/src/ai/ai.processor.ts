import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job } from 'bull';
import { AiService, AiMessage } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

export interface AiJobData {
  campaignId: string;
  userId?: string;
  username?: string;
  prompt: string;
  type: 'scene' | 'npc' | 'chat' | 'check_format';
}

export interface AiCompletedEvent {
  campaignId: string;
  message: {
    id: string;
    campaignId: string;
    senderId: string | null;
    senderName: string;
    senderType: string;
    content: string;
    messageType: string;
    metadata: any;
    createdAt: string;
  };
}

export interface AiStreamEvent {
  campaignId: string;
  messageId: string;
  chunk: string;
  done: boolean;
}

@Processor('ai-generation')
@Injectable()
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private ai: AiService,
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  @Process('generate')
  async handleGenerate(job: Job<AiJobData>) {
    const { campaignId, userId, username, prompt, type } = job.data;
    this.logger.log(`[Job ${job.id}] 开始处理 AI 任务: type=${type}`);

    // 先创建空消息，用于流式输出
    const aiMessage = await this.prisma.message.create({
      data: {
        campaignId,
        senderId: userId || null,
        senderName: 'AI-KP',
        senderType: 'AI',
        content: '',
        messageType: 'AI_DECISION',
        metadata: { level: 'L1', action: type, _typing: true },
      },
    });

    const messageId = aiMessage.id;

    // 广播消息占位（前端会创建空消息并显示打字光标）
    const basePayload = {
      id: messageId,
      campaignId: aiMessage.campaignId,
      senderId: aiMessage.senderId,
      senderName: aiMessage.senderName,
      senderType: aiMessage.senderType,
      content: '',
      messageType: aiMessage.messageType,
      metadata: aiMessage.metadata,
      createdAt: aiMessage.createdAt.toISOString(),
    };
    this.events.emit('ai.completed', { campaignId, message: basePayload });

    try {
      let content = '';

      const systemPrompt = await this.ai.buildSystemPrompt(campaignId);
      const messages: AiMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      if (type === 'scene') {
        messages.push({ role: 'system', content: '根据上下文生成沉浸式场景描述，不超过150字。' });
        messages.push({ role: 'user', content: prompt });
      } else if (type === 'npc') {
        messages.push({ role: 'system', content: '根据NPC设定和玩家对话生成NPC回复，不超过100字。' });
        messages.push({ role: 'user', content: prompt });
      } else if (type === 'check_format') {
        messages.push({ role: 'system', content: '将技能检定结果转换为叙事化描述，不超过80字。' });
        messages.push({ role: 'user', content: prompt });
      } else {
        messages.push({ role: 'system', content: '你是一位COC七版规则的资深KP。' });
        messages.push({ role: 'user', content: prompt });
      }

      // Try true SSE streaming first
      try {
        const stream = this.ai.streamOpenAiCompletion(messages, {
          tools: this.ai.getFunctionTools(),
        });

        for await (const chunk of stream) {
          content += chunk;
          this.events.emit('ai.stream', {
            campaignId,
            messageId,
            chunk,
            done: false,
          } as AiStreamEvent);
        }
      } catch (streamErr: any) {
        // Fallback to non-streaming if SSE fails
        this.logger.warn(`[Job ${job.id}] SSE流式失败，降级为非流式: ${streamErr.message}`);
        if (type === 'scene') {
          content = await this.ai.generateSceneDescription(campaignId, prompt);
        } else if (type === 'npc') {
          content = await this.ai.generateNpcResponse(campaignId, prompt);
        } else if (type === 'check_format') {
          content = await this.ai.formatCheckResult(campaignId, JSON.parse(prompt));
        } else {
          content = await this.ai.chatWithContext(campaignId, [
            { role: 'user', content: prompt },
          ]);
        }

        // Pseudo-stream for fallback
        const words = content.split(/(?=\s)|(?<=\s)/);
        for (const word of words) {
          this.events.emit('ai.stream', {
            campaignId,
            messageId,
            chunk: word,
            done: false,
          } as AiStreamEvent);
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      // Update DB with full content
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          metadata: { level: 'L1', action: type },
        },
      });

      // Send completion marker
      this.events.emit('ai.stream', {
        campaignId,
        messageId,
        chunk: '',
        done: true,
      } as AiStreamEvent);

      this.logger.log(`[Job ${job.id}] AI 任务完成，消息已广播`);
    } catch (err: any) {
      this.logger.error(`[Job ${job.id}] AI 任务失败: ${err.message}`);

      const errorContent = `AI生成失败: ${err.message}`;
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content: errorContent,
          senderName: '系统',
          senderType: 'SYSTEM',
          messageType: 'SYSTEM',
          metadata: { level: 'L1', action: type, error: true },
        },
      });

      this.events.emit('ai.stream', {
        campaignId,
        messageId,
        chunk: errorContent,
        done: true,
      } as AiStreamEvent);

      throw err;
    }
  }
}
