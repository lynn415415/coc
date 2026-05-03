import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { DiceService } from '../dice/dice.service';

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
  ) {}

  handleConnection(client: CampaignSocket) {
    // 从查询参数或握手信息获取用户身份（简化实现，生产环境应验证JWT）
    const userId = client.handshake.query.userId as string;
    const username = client.handshake.query.username as string;
    if (userId) {
      client.data.userId = userId;
      client.data.username = username || '匿名';
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
  async handleMessage(client: CampaignSocket, payload: { content: string; messageType?: string; metadata?: any }) {
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
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      },
    });

    const broadcastData = {
      id: message.id,
      campaignId: message.campaignId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType,
      metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
      createdAt: message.createdAt,
    };

    this.server.to(`campaign:${campaignId}`).emit('new_message', broadcastData);
    return { success: true, message: broadcastData };
  }

  @SubscribeMessage('send_system_message')
  async handleSystemMessage(client: CampaignSocket, payload: { content: string; metadata?: any }) {
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
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      },
    });

    const broadcastData = {
      id: message.id,
      campaignId: message.campaignId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType,
      metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
      createdAt: message.createdAt,
    };

    this.server.to(`campaign:${campaignId}`).emit('new_message', broadcastData);
    return { success: true, message: broadcastData };
  }

  @SubscribeMessage('request_check')
  async handleCheck(client: CampaignSocket, payload: {
    targetValue: number;
    skillName?: string;
    bonusDice?: number;
    penaltyDice?: number;
    investigatorId?: string;
  }) {
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
        metadata: JSON.stringify({ description: result.description }),
      },
    });

    const broadcastData = {
      id: rollRecord.id,
      campaignId,
      senderId: client.data.userId,
      senderName: client.data.username,
      skillName: payload.skillName,
      targetValue: payload.targetValue,
      rollResult: result.roll,
      successLevel: result.successLevel,
      description: result.description,
      bonusDice: payload.bonusDice || 0,
      penaltyDice: payload.penaltyDice || 0,
      createdAt: rollRecord.createdAt,
    };

    this.server.to(`campaign:${campaignId}`).emit('check_result', broadcastData);
    return { success: true, result: broadcastData };
  }

  @SubscribeMessage('scene_change')
  async handleSceneChange(client: CampaignSocket, payload: { sceneId: string; sceneName?: string }) {
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
  async handlePresence(client: CampaignSocket, payload: { status: string }) {
    const campaignId = client.data.campaignId;
    if (!campaignId) return { error: '未加入房间' };

    client.to(`campaign:${campaignId}`).emit('presence_update', {
      userId: client.data.userId,
      username: client.data.username,
      status: payload.status,
    });

    return { success: true };
  }
}
