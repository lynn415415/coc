// ========== 枚举字面量 ==========

export type SenderType = 'PLAYER' | 'GM' | 'SYSTEM' | 'AI' | 'BOT';

export type MessageType =
  | 'TEXT'
  | 'CHECK'
  | 'SYSTEM'
  | 'COMBAT'
  | 'CLUE'
  | 'AI_DECISION'
  | 'SCENE_CHANGE';

export type AiLevel = 'L1' | 'L2' | 'L3';

export type SuccessLevel = 'critical' | 'success' | 'failure' | 'fumble';

// ========== 消息 Payload（存入 DB metadata）==========

export interface CheckPayload {
  skillName?: string;
  targetValue: number;
  rollResult: number;
  successLevel: SuccessLevel;
  description: string;
  bonusDice?: number;
  penaltyDice?: number;
  rawDice?: unknown;
}

export interface CombatPayload {
  action: 'START' | 'NEXT_TURN' | 'END' | 'HP_CHANGE';
  roundNumber?: number;
  turnIndex?: number;
  combatantId?: string;
  delta?: number;
  hp?: number;
  maxHp?: number;
}

export interface AiDecisionPayload {
  level: AiLevel;
  action: string;
  result?: string;
  suggestionId?: string;
}

export interface SceneChangePayload {
  sceneId: string;
  sceneName?: string;
  changedBy?: string;
}

export type MessageMetadata =
  | CheckPayload
  | CombatPayload
  | AiDecisionPayload
  | SceneChangePayload
  | Record<string, unknown>;

// ========== 消息广播结构（WebSocket 输出）==========

export interface BaseBroadcastMessage {
  id: string;
  campaignId: string;
  senderId: string | null;
  senderName: string;
  senderType: SenderType;
  content: string;
  messageType: MessageType;
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface CheckBroadcastMessage extends BaseBroadcastMessage {
  messageType: 'CHECK';
  skillName?: string;
  targetValue: number;
  rollResult: number;
  successLevel: SuccessLevel;
  description: string;
  bonusDice: number;
  penaltyDice: number;
  rawDice?: unknown;
}

export type BroadcastMessage = BaseBroadcastMessage | CheckBroadcastMessage;

// ========== WebSocket 入参 Payload ==========

export interface SendMessagePayload {
  content: string;
  messageType?: MessageType;
  metadata?: MessageMetadata;
}

export interface SendSystemMessagePayload {
  content: string;
  metadata?: MessageMetadata;
}

export interface RequestCheckPayload {
  targetValue: number;
  skillName?: string;
  bonusDice?: number;
  penaltyDice?: number;
  investigatorId?: string;
}

export interface SceneChangePayloadInput {
  sceneId: string;
  sceneName?: string;
}

export interface PresenceUpdatePayload {
  status: string;
}

export interface AiGeneratePayload {
  prompt: string;
  type: 'scene' | 'npc' | 'chat';
}

export interface AiFormatCheckPayload {
  skillName: string;
  targetValue: number;
  rollResult: number;
  successLevel: SuccessLevel;
  description: string;
}

export interface CombatStartPayload {
  investigatorIds: string[];
  npcs?: unknown[];
}

export interface CombatUpdateHpPayload {
  combatantId: string;
  hp: number;
  delta: number;
}
