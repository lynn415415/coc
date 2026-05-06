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

export interface BaseMessage {
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

export interface CheckMessage extends BaseMessage {
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

export type Message = BaseMessage | CheckMessage;
