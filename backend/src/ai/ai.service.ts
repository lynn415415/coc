import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  tools?: any[];
}

interface CachedPrompt {
  prompt: string;
  updatedAt: Date;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly timeout: number;

  // Prompt 缓存: campaignId → cached system prompt
  private promptCache = new Map<string, CachedPrompt>();

  // COC 规则书摘要（静态，所有战役共享）
  private readonly cocRuleSummary = `你是克苏鲁的呼唤（Call of Cthulhu）七版规则的资深守秘人（KP）。
核心规则要点：
- 技能检定使用d100，掷骰结果≤目标值则成功。
- 成功等级：掷骰结果≤目标值/5为极难成功，≤目标值/2为难成功，≤目标值为常规成功。
- 大成功：掷骰结果为1-5且≤目标值（目标值<50时1-2）。
- 大失败：掷骰结果为96-100且>目标值（目标值≥50时96-100）。
- 理智检定（SAN Check）：看到恐怖事物时掷d100，失败则扣除SAN值，可能引发临时/不定/永久疯狂。
- 战斗轮：按DEX从高到低排序，同DEX时掷1d100决定先后。
- 追逐：使用追逐规则，MOVE值决定每轮移动距离。
- 你的职责是营造恐怖氛围，公正裁决检定，推进剧情，但绝不直接透露模组真相。`;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.provider = this.config.get<string>('AI_PROVIDER') || 'openai-compatible';
    this.baseUrl = this.config.get<string>('AI_BASE_URL') || '';
    this.apiKey = this.config.get<string>('AI_API_KEY') || '';
    this.defaultModel = this.config.get<string>('AI_MODEL') || 'deepseek-v4-pro';
    this.defaultTemperature = parseFloat(this.config.get<string>('AI_TEMPERATURE') || '0.7');
    this.defaultMaxTokens = parseInt(this.config.get<string>('AI_MAX_TOKENS') || '2048', 10);
    this.timeout = parseInt(this.config.get<string>('AI_TIMEOUT_MS') || '30000', 10);
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  // ========== Prompt Caching ==========

  async buildSystemPrompt(campaignId: string): Promise<string> {
    const cached = this.promptCache.get(campaignId);
    if (cached) {
      this.logger.debug(`[PromptCache] 命中 campaign=${campaignId}`);
      return cached.prompt;
    }

    this.logger.log(`[PromptCache] 构建 campaign=${campaignId}`);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    const currentScene = await this.prisma.scene.findFirst({
      where: { campaignId, isActive: true },
    });

    let prompt = this.cocRuleSummary + '\n\n';

    if (campaign) {
      prompt += `=== 战役设定 ===\n`;
      prompt += `战役名称：${campaign.title}\n`;
      if (campaign.era) prompt += `时代：${campaign.era}\n`;
      if (campaign.description) prompt += `简介：${campaign.description}\n`;
      if (campaign.customRules) prompt += `房规：${campaign.customRules}\n`;

      if (currentScene) {
        prompt += `\n=== 当前场景 ===\n`;
        if (currentScene.name) prompt += `场景：${currentScene.name}\n`;
        if (currentScene.description) prompt += `描述：${currentScene.description}\n`;
      }
    }

    this.promptCache.set(campaignId, { prompt, updatedAt: new Date() });
    return prompt;
  }

  invalidateCache(campaignId: string) {
    if (this.promptCache.has(campaignId)) {
      this.logger.log(`[PromptCache] 清除 campaign=${campaignId}`);
      this.promptCache.delete(campaignId);
    }
  }

  clearAllCache() {
    this.logger.log(`[PromptCache] 清除全部缓存（共 ${this.promptCache.size} 条）`);
    this.promptCache.clear();
  }

  async chatCompletion(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI API未配置，请检查环境变量 AI_BASE_URL 和 AI_API_KEY');
    }

    try {
      if (this.provider === 'anthropic') {
        return await this.anthropicCompletion(messages, options);
      }
      return await this.openAiCompletion(messages, options);
    } catch (error: any) {
      this.logger.error(`AI API调用失败: ${error.message}`, error.response?.data);
      throw new Error(`AI服务暂时不可用: ${error.message}`);
    }
  }

  async chatWithContext(campaignId: string, messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const systemPrompt = await this.buildSystemPrompt(campaignId);
    const fullMessages: AiMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
    return this.chatCompletion(fullMessages, options);
  }

  private async anthropicCompletion(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: any = {
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens || this.defaultMaxTokens,
      messages: chatMessages,
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    if (options?.temperature != null) {
      body.temperature = options.temperature;
    } else {
      body.temperature = this.defaultTemperature;
    }

    const res = await axios.post(`${this.baseUrl}/v1/messages`, body, {
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });

    const textBlock = res.data.content?.find((c: any) => c.type === 'text');
    return textBlock?.text || '';
  }

  private async openAiCompletion(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const res = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? this.defaultTemperature,
        max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      },
    );

    return res.data.choices?.[0]?.message?.content || '';
  }

  // True SSE streaming: returns an async generator yielding chunks
  async *streamOpenAiCompletion(messages: AiMessage[], options?: AiCompletionOptions): AsyncGenerator<string> {
    const res = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature ?? this.defaultTemperature,
        max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
        stream: true,
        tools: options?.tools,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
        responseType: 'stream',
      },
    );

    const stream = res.data;
    let buffer = '';

    for await (const chunk of stream as AsyncIterable<Buffer>) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;

          // Handle tool calls in streaming
          const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
          if (toolCalls) {
            for (const tc of toolCalls) {
              if (tc.function?.arguments) {
                yield `\n[TOOL_CALL:${tc.function.name}:${tc.function.arguments}]\n`;
              }
            }
          }
        } catch { /* skip malformed JSON lines */ }
      }
    }
  }

  // Function Calling: COC-specific tool definitions
  getFunctionTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'roll_dice',
          description: '为指定调查员执行技能检定（d100骰子检定）',
          parameters: {
            type: 'object',
            properties: {
              skill_name: { type: 'string', description: '技能名称' },
              target_value: { type: 'integer', description: '目标值（技能当前值）' },
              bonus_dice: { type: 'integer', description: '奖励骰数量', default: 0 },
              penalty_dice: { type: 'integer', description: '惩罚骰数量', default: 0 },
            },
            required: ['skill_name', 'target_value'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_hp',
          description: '更新调查员HP值（伤害或治疗）',
          parameters: {
            type: 'object',
            properties: {
              investigator_name: { type: 'string', description: '调查员名称' },
              change: { type: 'integer', description: 'HP变化值（负数为伤害，正数为治疗）' },
              reason: { type: 'string', description: '变化原因' },
            },
            required: ['investigator_name', 'change', 'reason'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'consume_item',
          description: '消耗/使用调查员的物品',
          parameters: {
            type: 'object',
            properties: {
              investigator_name: { type: 'string', description: '调查员名称' },
              item_name: { type: 'string', description: '物品名称' },
              quantity: { type: 'integer', description: '消耗数量', default: 1 },
            },
            required: ['investigator_name', 'item_name'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'san_check',
          description: '执行理智检定（SAN Check）',
          parameters: {
            type: 'object',
            properties: {
              investigator_name: { type: 'string', description: '调查员名称' },
              san_loss_formula: { type: 'string', description: 'SAN损失公式，如 1d3 或 1d10' },
              trigger: { type: 'string', description: '触发SAN检定的事件描述' },
            },
            required: ['investigator_name', 'san_loss_formula', 'trigger'],
          },
        },
      },
    ];
  }

  async generateSceneDescription(campaignId: string, context: string): Promise<string> {
    const taskPrompt = `你是一位克苏鲁的呼唤（COC）七版规则的资深KP（守秘人）。你的任务是根据当前场景上下文，生成一段沉浸式的场景描述。要求：
- 使用中文，风格阴郁、神秘、富有氛围感
- 包含视觉、听觉、嗅觉等多感官细节
- 不超过150字
- 不要直接告诉玩家线索，只描述环境`;

    return this.chatWithContext(campaignId, [
      { role: 'system', content: taskPrompt },
      { role: 'user', content: context },
    ]);
  }

  async generateNpcResponse(campaignId: string, context: string): Promise<string> {
    const taskPrompt = `你是一位COC七版规则的资深KP。根据提供的NPC设定和玩家对话，生成NPC的回复。要求：
- 使用中文，符合NPC性格和背景
- 语气自然，不要像AI
- 不超过100字
- 如果NPC被激怒或恐惧，语气要相应变化`;

    return this.chatWithContext(campaignId, [
      { role: 'system', content: taskPrompt },
      { role: 'user', content: context },
    ]);
  }

  async formatCheckResult(campaignId: string, checkData: {
    skillName: string;
    targetValue: number;
    rollResult: number;
    successLevel: string;
    description: string;
  }): Promise<string> {
    const taskPrompt = `你是一位COC七版规则的资深KP。将一次技能检定的结果转换为叙事化的描述。要求：
- 根据成功等级（大成功/成功/失败/大失败）调整叙事语气
- 将冰冷的数字转化为生动的场景描述
- 不超过80字
- 只输出描述文本，不要加前缀`;

    const userContent = `技能：${checkData.skillName}
目标值：${checkData.targetValue}
掷骰结果：${checkData.rollResult}
成功等级：${checkData.successLevel}
规则描述：${checkData.description}`;

    return this.chatWithContext(campaignId, [
      { role: 'system', content: taskPrompt },
      { role: 'user', content: userContent },
    ]);
  }

  async suggestAction(campaignId: string, context: string): Promise<string> {
    const taskPrompt = `你是一位COC七版规则的资深KP。玩家描述了一个模糊的行动，你需要建议：
1. 应该使用什么技能进行检定
2. 检定的难度（常规/困难/极难）
3. 如果成功或失败会发生什么
要求：简洁明了，不超过100字。`;

    return this.chatWithContext(campaignId, [
      { role: 'system', content: taskPrompt },
      { role: 'user', content: context },
    ]);
  }
}
