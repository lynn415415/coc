import { Controller, Post, Get, Body, Param, UnauthorizedException } from '@nestjs/common';
import { AiService, AiMessage } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService, private prisma: PrismaService) {}

  @Post('chat')
  async chat(@Body('messages') messages: AiMessage[], @Body('options') options?: any) {
    if (!this.aiService.isConfigured()) {
      throw new UnauthorizedException('AI服务未配置');
    }
    const content = await this.aiService.chatCompletion(messages, options);
    return { content };
  }

  @Post('scene')
  async scene(@Body('context') context: string, @Body('campaignId') campaignId?: string) {
    if (!this.aiService.isConfigured()) {
      throw new UnauthorizedException('AI服务未配置');
    }
    const content = campaignId
      ? await this.aiService.generateSceneDescription(campaignId, context)
      : await this.aiService.chatCompletion([
          { role: 'system', content: '你是一位COC七版规则的资深KP。' },
          { role: 'user', content: context },
        ]);
    return { content };
  }

  @Post('npc')
  async npc(@Body('context') context: string, @Body('campaignId') campaignId?: string) {
    if (!this.aiService.isConfigured()) {
      throw new UnauthorizedException('AI服务未配置');
    }
    const content = campaignId
      ? await this.aiService.generateNpcResponse(campaignId, context)
      : await this.aiService.chatCompletion([
          { role: 'system', content: '你是一位COC七版规则的资深KP。' },
          { role: 'user', content: context },
        ]);
    return { content };
  }

  @Post('format-check')
  async formatCheck(@Body('checkData') checkData: any, @Body('campaignId') campaignId?: string) {
    if (!this.aiService.isConfigured()) {
      throw new UnauthorizedException('AI服务未配置');
    }
    const content = campaignId
      ? await this.aiService.formatCheckResult(campaignId, checkData)
      : await this.aiService.chatCompletion([
          { role: 'system', content: '你是一位COC七版规则的资深KP。' },
          { role: 'user', content: JSON.stringify(checkData) },
        ]);
    return { content };
  }

  @Post('suggest')
  async suggest(@Body('context') context: string, @Body('campaignId') campaignId?: string) {
    if (!this.aiService.isConfigured()) {
      throw new UnauthorizedException('AI服务未配置');
    }
    const content = campaignId
      ? await this.aiService.suggestAction(campaignId, context)
      : await this.aiService.chatCompletion([
          { role: 'system', content: '你是一位COC七版规则的资深KP。' },
          { role: 'user', content: context },
        ]);
    return { content };
  }

  @Get(':campaignId/decision-log')
  async getDecisionLog(@Param('campaignId') campaignId: string) {
    return this.prisma.aiActionLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Post(':campaignId/decision-log')
  async createDecisionLog(@Param('campaignId') campaignId: string, @Body() data: any) {
    return this.prisma.aiActionLog.create({
      data: {
        campaignId,
        messageId: data.id || `log-${Date.now()}`,
        rawText: data.action || '',
        parsedAction: { level: data.level, action: data.action },
        confidence: 1.0,
      },
    });
  }
}
