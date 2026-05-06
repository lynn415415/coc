import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { DiceService } from '../dice/dice.service';
import { AiService } from '../ai/ai.service';
import { CombatService } from '../combat/combat.service';
import type { AiCompletedEvent, AiStreamEvent } from '../ai/ai.processor';
import type {
  SendMessagePayload,
  SendSystemMessagePayload,
  RequestCheckPayload,
  SceneChangePayloadInput,
  PresenceUpdatePayload,
  AiGeneratePayload,
  AiFormatCheckPayload,
  CombatStartPayload,
  CombatUpdateHpPayload,
  MessageMetadata,
  BaseBroadcastMessage,
  CheckBroadcastMessage,
} from '../common/types/message.types';

interface CampaignSocket extends Socket {
  data: {
    userId?: string;
    campaignId?: string;
    username?: string;
  };
}

@WebSocketGateway({ namespace: 'campaign', cors: { origin: '*' } })
export class CampaignGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private dice: DiceService,
    private jwt: JwtService,
    private ai: AiService,
    private combat: CombatService,
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

  handleConnection(client: CampaignSocket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string) ||
      (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = this.jwt.verify(token);
        client.data.userId = payload.sub;
        client.data.username = payload.username || payload.nickname || '匿名';
      } catch {
        client.disconnect(true);
      }
    } else {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: CampaignSocket) {
    if (client.data.campaignId) {
      client.to(`campaign:${client.data.campaignId}`).emit('user_left', {
        userId: client.data.userId,
        username: client.data.username,
      });
    }
  }

  @OnEvent('ai.completed')
  handleAiCompleted(payload: AiCompletedEvent) {
    this.server.to(`campaign:${payload.campaignId}`).emit('new_message', payload.message);
  }

  @OnEvent('ai.stream')
  handleAiStream(payload: AiStreamEvent) {
    this.server.to(`campaign:${payload.campaignId}`).emit('ai_stream', payload);
  }

  @SubscribeMessage('join_campaign')
  async handleJoin(client: CampaignSocket, payload: { campaignId: string }) {
    const { campaignId } = payload;
    client.data.campaignId = campaignId;
    client.join(`campaign:${campaignId}`);

    // 广播用户加入
    client.to(`campaign:${campaignId}`).emit('user_joined', {
      userId: client.data.userId,
      username: client.data.username,
    });

    return { success: true, campaignId };
  }

  @SubscribeMessage('leave_campaign')
  async handleLeave(client: CampaignSocket) {
    const campaignId = client.data.campaignId;
    if (campaignId) {
      client.leave(`campaign:${campaignId}`);
      client.to(`campaign:${campaignId}`).emit('user_left', {
        userId: client.data.userId,
        username: client.data.username,
      });
      client.data.campaignId = undefined;
    }
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: CampaignSocket, payload: SendMessagePayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    const message = await this.prisma.message.create({
      data: {
        campaignId,
        senderId: client.data.userId,
        senderName: client.data.username || '匿名',
        senderType: 'USER',
        content: payload.content,
        messageType: payload.messageType || 'TEXT',
        metadata: (payload.metadata ?? undefined) as any,
      },
    });

    const broadcastData: BaseBroadcastMessage = {
      id: message.id,
      campaignId: message.campaignId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType as any,
      content: message.content,
      messageType: message.messageType as any,
      metadata: (message.metadata ?? undefined) as MessageMetadata | undefined,
      createdAt: message.createdAt.toISOString(),
    };

    this.server.to(`campaign:${campaignId}`).emit('new_message', broadcastData);

    // L1: AI全自动 — 检测 /ai 命令并生成内容
    if (payload.content?.startsWith('/ai ')) {
      const prompt = payload.content.slice(4).trim();
      if (prompt && this.ai.isConfigured()) {
        this.handleAiCommand(campaignId, client.data.userId, prompt).catch(() => {});
      }
    }

    return { success: true, message: broadcastData };
  }

  private async handleAiCommand(campaignId: string, userId: string | undefined, prompt: string) {
    await this.aiQueue.add('generate', {
      campaignId,
      userId,
      prompt,
      type: 'scene',
    });
  }

  @SubscribeMessage('send_system_message')
  async handleSystemMessage(client: CampaignSocket, payload: SendSystemMessagePayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    const message = await this.prisma.message.create({
      data: {
        campaignId,
        senderId: null,
        senderName: '系统',
        senderType: 'SYSTEM',
        content: payload.content,
        messageType: 'SYSTEM',
        metadata: (payload.metadata ?? undefined) as any,
      },
    });

    const sysBroadcast: BaseBroadcastMessage = {
      id: message.id,
      campaignId: message.campaignId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType as any,
      content: message.content,
      messageType: message.messageType as any,
      metadata: (message.metadata ?? undefined) as MessageMetadata | undefined,
      createdAt: message.createdAt.toISOString(),
    };

    this.server.to(`campaign:${campaignId}`).emit('new_message', sysBroadcast);
    return { success: true, message: sysBroadcast };
  }

  @SubscribeMessage('request_check')
  async handleCheck(client: CampaignSocket, payload: RequestCheckPayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    const result = this.dice.skillCheck(
      payload.targetValue,
      payload.bonusDice || 0,
      payload.penaltyDice || 0,
    );

    const rollRecord = await this.prisma.rollRecord.create({
      data: {
        campaignId,
        userId: client.data.userId,
        investigatorId: payload.investigatorId,
        rollType: 'SKILL',
        skillName: payload.skillName,
        targetValue: payload.targetValue,
        rollResult: result.roll,
        successLevel: result.successLevel,
        bonusDice: payload.bonusDice || 0,
        penaltyDice: payload.penaltyDice || 0,
        metadata: { description: result.description },
      },
    });

    const checkBroadcast: CheckBroadcastMessage = {
      id: rollRecord.id,
      campaignId,
      senderId: client.data.userId ?? null,
      senderName: client.data.username || '匿名',
      senderType: 'PLAYER',
      content: `${payload.skillName || '检定'}: ${result.roll}/${payload.targetValue} → ${result.description}`,
      messageType: 'CHECK',
      skillName: payload.skillName,
      targetValue: payload.targetValue,
      rollResult: result.roll,
      successLevel: result.successLevel as any,
      description: result.description,
      bonusDice: payload.bonusDice || 0,
      penaltyDice: payload.penaltyDice || 0,
      rawDice: result.rawDice,
      createdAt: rollRecord.createdAt.toISOString(),
    };

    this.server.to(`campaign:${campaignId}`).emit('check_result', checkBroadcast);
    return { success: true, result: checkBroadcast };
  }

  @SubscribeMessage('scene_change')
  async handleSceneChange(client: CampaignSocket, payload: SceneChangePayloadInput) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    // 简化实现：广播场景切换事件，实际权限由调用方控制
    this.server.to(`campaign:${campaignId}`).emit('scene_changed', {
      sceneId: payload.sceneId,
      sceneName: payload.sceneName,
      changedBy: client.data.userId,
    });

    return { success: true };
  }

  @SubscribeMessage('presence_update')
  async handlePresence(client: CampaignSocket, payload: PresenceUpdatePayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    client.to(`campaign:${campaignId}`).emit('presence_update', {
      userId: client.data.userId,
      username: client.data.username,
      status: payload.status,
    });

    return { success: true };
  }

  @SubscribeMessage('ai_generate')
  async handleAiGenerate(client: CampaignSocket, payload: AiGeneratePayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };
    if (!this.ai.isConfigured()) return { error: 'AI服务未配置' };

    await this.aiQueue.add('generate', {
      campaignId,
      userId: client.data.userId,
      username: client.data.username,
      prompt: payload.prompt,
      type: payload.type,
    });
    return { success: true, queued: true };
  }

  @SubscribeMessage('ai_format_check')
  async handleAiFormatCheck(client: CampaignSocket, payload: AiFormatCheckPayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };
    if (!this.ai.isConfigured()) return { error: 'AI服务未配置' };

    await this.aiQueue.add('generate', {
      campaignId,
      userId: client.data.userId,
      username: client.data.username,
      prompt: JSON.stringify(payload),
      type: 'check_format',
    });
    return { success: true, queued: true };
  }

  // ===== Combat Events =====

  @SubscribeMessage('combat_start')
  async handleCombatStart(client: CampaignSocket, payload: CombatStartPayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    try {
      const combat = await this.combat.startCombat(campaignId, payload.investigatorIds, (payload.npcs || []) as any);
      this.server.to(`campaign:${campaignId}`).emit('combat_updated', combat);
      return { success: true, combat };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @SubscribeMessage('combat_next_turn')
  async handleCombatNextTurn(client: CampaignSocket) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    try {
      await this.combat.tickConditions(campaignId);
      const combat = await this.combat.nextTurn(campaignId);
      this.server.to(`campaign:${campaignId}`).emit('combat_updated', combat);
      return { success: true, combat };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @SubscribeMessage('combat_end')
  async handleCombatEnd(client: CampaignSocket) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    try {
      const combat = await this.combat.endCombat(campaignId);
      this.server.to(`campaign:${campaignId}`).emit('combat_updated', null);
      this.server.to(`campaign:${campaignId}`).emit('combat_ended', combat);
      return { success: true, combat };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  @SubscribeMessage('combat_update_hp')
  async handleCombatHp(client: CampaignSocket, payload: CombatUpdateHpPayload) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    try {
      const combatant = await this.combat.updateCombatantHp(payload.combatantId, payload.hp);
      const combat = await this.combat.getActiveCombat(campaignId);
      this.server.to(`campaign:${campaignId}`).emit('combat_updated', combat);

      // 广播HP变化消息
      const deltaStr = payload.delta >= 0 ? `+${payload.delta}` : `${payload.delta}`;
      const hpBroadcast: BaseBroadcastMessage = {
        id: `combat-${Date.now()}`,
        campaignId,
        senderId: null,
        senderName: '战斗系统',
        senderType: 'SYSTEM',
        content: `${combatant.name} HP ${deltaStr}（${payload.hp}/${combatant.maxHp}）`,
        messageType: 'COMBAT',
        metadata: { action: 'HP_CHANGE', combatantId: payload.combatantId, hp: payload.hp, maxHp: combatant.maxHp } as MessageMetadata,
        createdAt: new Date().toISOString(),
      };
      this.server.to(`campaign:${campaignId}`).emit('new_message', hpBroadcast);

      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
