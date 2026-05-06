# COC七版跑团平台开发计划 V2.1（AI-KP重构版）

> 版本: 2.1  
> 基准日期: 2026-05-03  
> 技术栈: Vue 3 + TypeScript + Pinia + Naive UI + Socket.io-client | NestJS + Prisma + PostgreSQL + Redis | Docker Compose  
> 调研输入: `platform-research-report.md` / `vtt-deep-research-ui-alignment.md`  
> 评审输入: `zhang-yiming-perspective` / `design-principles` / `frontend-design`

---

## 一、核心产品定位（更新）

**AI替代KP重复劳动**——不是"AI辅助KP"，而是让AI成为KP的"自动驾驶系统"。

### 1.1 AI自动化四级架构

| 层级 | 名称 | 决策权 | 典型场景 | 设计原则 |
|------|------|--------|---------|---------|
| **L1** | 全自动 | AI执行，无需审核 | 场景描述、NPC闲聊、检定文本格式化、氛围渲染 | **透明度优先**：所有L1决策在角落微标显示"AI已执行"，可展开查看详情 |
| **L2** | 半自动 | AI执行+日志记录 | 标准技能检定判定、HP/MP/SAN变化、常规物品消耗、先攻排序 | **可感知性**：数值变化时聊天区显示带"⚡AI"徽章的结构化卡片，1秒内自动确认 |
| **L3** | 建议模式 | AI建议+KP一键确认 | 线索发放、场景切换、新NPC登场、战斗外行动判定 | **控制感优先**：AI建议以"待审核卡片"形式推送，KP可一键✓/✗/编辑 |
| **L4** | 人工优先 | AI辅助但不替代 | 模组改编、非标准规则、越轨行为、关键剧情转折 | **绝不越界**：AI只提供参考文本，不输出任何可能改变剧情走向的建议 |

### 1.2 关键设计原则（from design-principles skill）

**信任边界的视觉传达**：
- **L1/L2**：用"幽灵灰"色（`#8a8a9a`）微标+轻量图标标识AI执行的内容，不阻断用户主视觉流
- **L3**：用"琥珀色"（`#f0a020`）边框+脉冲动画吸引KP注意，同时提供"一键确认"按钮在拇指热区
- **L4**：AI建议以"折叠便签"形式出现在KP面板边缘，不弹出、不闪烁、不强制阅读

**自动化 vs 人工控制的视觉设计**：
- **Proximity原则**：同一轮次内所有AI决策（L1-L3）在视觉上聚合为一个"AI决策块"，与玩家消息保持32px间距
- **Similarity原则**：AI执行的消息卡片统一使用左侧4px的`#8a8a9a`色条，KP手动操作的消息使用`#8B4513`品牌色条
- **Figure/Ground**：AI思考中的状态用低对比度的"..."微动画在背景层运行，绝不以弹窗/模态框形式打断主流程

**克苏鲁氛围 vs AI效率的取舍**：
- **Tone方向**：选择"老旧档案室中的精密仪器"美学——暗色背景（`#1a1a2e`）+ 暖色纸张纹理（`#f5f5f0`）+ 机械感的等宽数字（COC检定结果）
- **Motion克制**：AI输出使用打字机效果（逐字出现），而非淡入/滑入——打字机本身就是"神秘文本被破译"的叙事
- **Contrast运用**：AI的理性输出（等宽字体、灰色调）与KP的人工创作（衬线字体、暖色调）在字体和色彩上形成对比，让用户本能感知"这是机器"vs"这是人"

---

## 二、重构后的Phase划分

### 总览

| Phase | 周期 | 核心目标 | 用户价值 | 状态 |
|-------|------|---------|---------|------|
| **Phase 2A** | 2-3周 | AI KP原型（最简版）+ 前端UI快速改进 | **验证差异化假设** | ✅ 已完成 (2026-05-04) |
| **Phase 2B** | 4-5周 | Combat Tracker核心 + 消息协议强类型化 | 追赶VTT基础体验 | ✅ 已完成 (2026-05-04) |
| **Phase 3** | 6-8周 | 轻量地图 + 线索Entity系统 + 快捷指令 | 场景可视化、线索可追踪 | ✅ 已完成 (2026-05-04) |
| **Phase 4** | 6-8周 | AI工程化（队列/流式/RAG）+ 复盘系统（时间线） | 核心壁垒建立 + 差异化闭环 | ✅ 已完成 (2026-05-05) |
| **Phase 5** | 待定 | 插件系统 + Solo模式 + Bot桥接 + PDF导出 | 生态扩展 | ⏳ 延后 |

### 为什么这样重构？

张一鸣评审的核心判断：**"建立壁垒"的事放得太晚，"追赶竞品"的事放得太早。**

- **AI必须前置验证**：如果Phase 5才碰AI，窗口期已过。Phase 2A用2周做一个粗糙原型（HTTP调用OpenAI API + loading状态），验证"用户是否真的觉得AI有用"。
- **Combat Tracker精简**：COC的战斗轮本质是"DEX排序列表"，不需要DND级别的复杂度。条件计时器、范围测量可以延后。
- **地图轻量化**：COC不依赖网格战术，地图的核心价值是"氛围和线索定位"，不是"战斗计算"。
- **插件系统砍到Phase 5**：Foundry的模块系统有价值是因为它有用户和开发者。我们现在连核心用户都没有，设计`coc-module.json`是过度设计。

---

## 三、Phase 2A: AI KP原型 + 前端UI快速改进

### 3.1 AI KP原型（最简版）

**目标**：2周内验证"AI替代KP重复劳动"的核心假设。

**技术实现**：
- 后端：`AiService` 封装 OpenAI 兼容 API，单次 HTTP 调用，无队列、无流式、无缓存
- 前端：`AiPanel.vue` 侧边面板，显示AI生成的场景描述和NPC对话
- 触发方式：KP在聊天框输入 `/ai 描述一下这个房间` 或点击AI面板按钮
- **关键**：所有AI输出默认以L1（全自动）方式插入聊天流，但KP可以随时编辑或删除

**验证指标**：
- 有AI辅助的战役，KP的消息发送量减少30%+
- 玩家满意度问卷中"场景描述生动度"评分提升
- KP使用AI的频率（每周至少使用3次视为活跃）

### 3.2 前端UI快速改进（纯前端，无需后端）

**P0 优先级（1周内完成）**：

| 改进项 | 涉及文件 | 设计原则应用 | 工作量 |
|--------|---------|-------------|--------|
| 检定卡片动画 | `ChatPanel.vue` | **Contrast**：大成功用金色脉冲(`animation: pulse-gold 1.5s`)，大失败用暗红抖动(`animation: shake 0.5s`) | 4h |
| 技能hover规则提示 | `InvestigatorDetail.vue` | **Figure/Ground**：hover时`n-tooltip`浮现，背景模糊处理，焦点锁定在技能名 | 4h |
| 角色卡技能分类折叠 | `InvestigatorDetail.vue` | **Proximity**：`n-collapse`分组，默认只展开"有加点"的分类，未加点分类用淡灰色暗示可忽略 | 1d |

**P1 优先级（1-2周内完成）**：

| 改进项 | 涉及文件 | 设计原则应用 | 工作量 |
|--------|---------|-------------|--------|
| 成员列表hover迷你操作栏 | `MemberList.vue` | **Hierarchy**：hover时浮现操作栏，用Scale（1.05x）+ Elevation（shadow-md）建立层级 | 4h |
| 场景Banner视觉强化 | `CampaignRoom.vue` | **Unity**：暗色渐变背景（`linear-gradient(135deg, #1a1a2e, #0f3460)`）+ 文字阴影，所有场景Banner统一风格 | 4h |
| 聊天区消息类型差异化 | `ChatPanel.vue` | **Similarity**：系统消息用斜体+灰色，场景切换用全宽横幅+图标，线索消息带📎图标+可点击展开 | 1d |
| 底部宏条原型 | 新建 `MacroBar.vue` | **Repetition**：10格统一尺寸（48x48px），圆角8px，hover时Scale 1.1x + 边框高亮 | 1d |
| 暗色模式CSS变量 | `App.vue` / 全局CSS | **Contrast**：管理页保持浅色（`#f5f5f0`），跑团房默认暗色（`#1a1a2e`），用`data-theme`属性切换 | 1d |

---

## 四、AI-KP系统详细设计

### 4.1 架构分层

```
用户消息/场景变化
    │
    ├─► ActionRecognitionService（轻量规则引擎）
    │       ├─ 明确动作（如"我开枪"）→ 生成 ActionRecord → L2自动执行
    │       └─ 模糊描述 → 入队 AI Task Queue
    │
    └─► AiService.invoke()
            ├─ ContextBuilder 组装 prompt
            │   ├─ System Prompt（COC规则摘要 + 战役设定 + NPC人设）→ 常驻缓存
            │   └─ Dynamic Context（最近10条消息 + 当前场景 + 调查员状态）
            ├─ LLM Provider（OpenAI / Claude / Ollama）
            ├─ Response Parser（解析结构化输出）
            │   ├─ 纯文本描述 → L1，直接插入聊天
            │   ├─ 带 tool_call → L2/L3，执行后插入聊天
            │   └─ 有歧义建议 → L3，推送给KP审核
            └─ ToolExecutor（执行 roll_dice / give_clue / change_scene）
                └─ 结果通过 WebSocket 推送到房间
```

### 4.2 AI自动化四级触发规则

**L1 全自动触发条件**（无需审核，立即执行）：
```typescript
const L1_RULES = {
  sceneDescription: '场景切换后，AI自动生成场景描述文本',
  npcIdleChatter: 'NPC在非战斗状态下，玩家发起对话时，AI自动生成NPC回复',
  checkResultFormatting: '检定完成后，AI将数值结果转换为叙事文本（如"42/50成功——你敏锐地注意到..."）',
  atmosphereRender: '每轮行动结束后，AI自动生成环境氛围描述（天气/声音/气味）',
};
// 配置项：KP可在战役设置中关闭任意L1规则
```

**L2 半自动触发条件**（AI执行，但记录日志供回溯）：
```typescript
const L2_RULES = {
  standardSkillCheck: '标准技能检定（成功率明确，无特殊修正）→ AI自动判定成功/失败',
  hpMpSanChange: 'HP/MP/SAN的常规增减（如战斗伤害、休息恢复）→ AI自动计算并更新',
  itemConsumption: '常规物品消耗（如子弹-1、火把-1）→ AI自动扣减',
  initiativeSort: '战斗轮开始 → AI按DEX排序并处理同DEX掷骰',
};
// 所有L2决策在聊天区显示"⚡AI"徽章，可点击展开查看原始计算过程
```

**L3 建议模式触发条件**（AI建议，KP一键确认）：
```typescript
const L3_RULES = {
  clueDistribution: 'AI判断玩家行动可能发现线索 → 生成建议卡片，KP确认后发放',
  sceneTransition: 'AI判断当前场景已探索完毕 → 建议切换到下一场景',
  npcIntroduction: 'AI判断剧情需要新NPC → 生成NPC设定建议',
  playerActionJudge: '玩家描述模糊行动（如"我试着说服他"）→ AI建议检定的技能和难度',
};
// 建议卡片显示在KP面板的"待审核"区域，支持✓/✗/编辑三种操作
```

**L4 人工优先**（AI只提供参考，绝不输出可执行建议）：
```typescript
const L4_DOMAINS = {
  moduleAdaptation: '模组改编',
  nonStandardRules: 'KP自定义规则（如房规）',
  deviantBehavior: '玩家越轨行为（如攻击队友）',
  plotTwist: '关键剧情转折（如NPC背叛、真相揭露）',
};
// AI在这些领域只提供"参考文本"（如"如果你考虑让NPC背叛，这里有几个动机方向..."）
// 参考文本以"折叠便签"形式出现在KP面板边缘，不弹窗、不闪烁
```

### 4.3 前端组件设计

#### `AiPanel.vue`（KP专属侧边面板）

```
┌──────────────────────────┐
│ 🤖 AI-KP 控制面板         │
├──────────────────────────┤
│ [全局开关] AI辅助: [开●]  │
├──────────────────────────┤
│ L1 全自动                │
│ ☑ 场景描述  ☑ NPC对话    │
│ ☑ 检定文本  ☑ 氛围渲染   │
├──────────────────────────┤
│ L2 半自动                │
│ ☑ 检定判定  ☑ 数值变化   │
│ ☑ 物品消耗  ☑ 先攻排序   │
├──────────────────────────┤
│ L3 待审核 (2)            │
│ ┌────────────────────┐  │
│ │ 📋 建议发放线索     │  │
│ │ "玩家在书架发现了..."│  │
│ │ [✓确认] [✗拒绝] [✏️]│  │
│ └────────────────────┘  │
│ ┌────────────────────┐  │
│ │ 🎭 建议切换场景     │  │
│ │ "当前场景已探索..."  │  │
│ │ [✓确认] [✗拒绝] [✏️]│  │
│ └────────────────────┘  │
├──────────────────────────┤
│ 📜 AI决策日志            │
│ 14:32 ⚡ 自动: SAN-1    │
│ 14:30 ⚡ 自动: 手枪弹药-1│
│ 14:28 🤖 场景描述已生成 │
└──────────────────────────┘
```

**组件状态管理**：
```typescript
// Pinia Store: aiStore.ts
interface AiStore {
  // 全局配置
  enabled: boolean;
  provider: 'openai' | 'claude' | 'ollama';
  model: string;
  temperature: number;
  
  // 分级规则开关
  l1Rules: Record<string, boolean>;
  l2Rules: Record<string, boolean>;
  l3Rules: Record<string, boolean>;
  
  // 待审核队列
  pendingApprovals: AiSuggestion[];
  
  // 执行日志
  decisionLog: AiDecision[];
  
  // 流式输出状态
  isStreaming: boolean;
  currentStreamText: string;
}

interface AiSuggestion {
  id: string;
  type: 'CLUE' | 'SCENE_CHANGE' | 'NPC_INTRO' | 'ACTION_JUDGE';
  title: string;
  description: string;
  payload: any; // 结构化数据，如 { clueId: 'xxx', targetUserId: 'yyy' }
  createdAt: string;
}

interface AiDecision {
  id: string;
  level: 'L1' | 'L2' | 'L3';
  action: string;
  result: string;
  createdAt: string;
}
```

**事件流**：
```
[玩家发送消息] 
  → ChatPanel.vue 发送 send_message
  → CampaignGateway 收到消息
  → 后端 ActionRecognitionService 分析
    ├─ L1/L2 → 直接执行，WebSocket 广播 ai_decision
    └─ L3 → 创建 AiSuggestion，WebSocket 推送给KP
  → KP在AiPanel.vue看到待审核卡片
    ├─ 点击✓ → 调用 approveSuggestion API → 执行并广播
    ├─ 点击✗ → 调用 rejectSuggestion API → 仅记录日志
    └─ 点击✏️ → 打开编辑弹窗 → 修改后执行
```

#### `AiDecisionCard.vue`（聊天区AI决策展示）

```vue
<template>
  <div class="ai-decision-card" :class="`level-${level}`">
    <div class="ai-badge">
      <span class="ai-icon">⚡</span>
      <span class="ai-label">{{ levelLabel }}</span>
    </div>
    <div class="decision-content">
      <div class="decision-title">{{ title }}</div>
      <div class="decision-detail">{{ detail }}</div>
    </div>
    <div v-if="level === 'L3' && isKp" class="decision-actions">
      <n-button size="tiny" type="success" @click="approve">✓</n-button>
      <n-button size="tiny" type="error" @click="reject">✗</n-button>
    </div>
    <div class="timestamp">{{ formatTime(createdAt) }}</div>
  </div>
</template>

<style scoped>
.ai-decision-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-left: 4px solid;
  background: rgba(255,255,255,0.05);
  border-radius: 0 8px 8px 0;
  margin-bottom: 0.5rem;
}
.ai-decision-card.level-L1 { border-left-color: #8a8a9a; }
.ai-decision-card.level-L2 { border-left-color: #5bc0de; }
.ai-decision-card.level-L3 { border-left-color: #f0a020; }
.ai-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #8a8a9a;
  white-space: nowrap;
}
.ai-icon {
  font-size: 0.9rem;
}
.decision-content {
  flex: 1;
}
.decision-title {
  font-weight: 500;
  font-size: 0.85rem;
  color: #e0e0e0;
}
.decision-detail {
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-top: 0.2rem;
}
.decision-actions {
  display: flex;
  gap: 0.25rem;
}
.timestamp {
  font-size: 0.7rem;
  color: #666;
}
</style>
```

### 4.4 防止AI幻觉的技术方案

**Function Calling 分层策略**：
```typescript
// 无歧义操作 → 强制结构化输出
const EXACT_TOOLS = [
  { name: 'roll_dice', description: '执行标准d100检定', parameters: { skillName: string, targetValue: number, bonusDice?: number } },
  { name: 'update_hp', description: '修改HP', parameters: { investigatorId: string, delta: number } },
  { name: 'consume_item', description: '消耗物品', parameters: { itemId: string, quantity: number } },
];

// 有歧义操作 → AI输出建议文本，不输出结构化调用
const AMBIGUOUS_DOMAINS = [
  'skill_selection', // "说服门卫"可能是话术/心理学/魅力
  'damage_calculation', // 非标准武器/特殊规则
  'scene_interpretation', // 模组描述可能被AI误解
];
// 这些领域AI只输出自然语言建议，由KP确认后人工执行
```

**规则引擎兜底**：
- 所有数值计算（成功率、伤害、SAN损失）由硬编码规则引擎执行
- AI只负责"描述结果"，不负责"决定结果"
- AI的tool_call输出需经过规则引擎校验，校验不通过时降级为L3建议模式

**上下文压缩策略**：
```typescript
// 当对话超过4000 token时
async function compressContext(messages: Message[]): Promise<string> {
  // 1. 保留最近10条完整消息
  const recent = messages.slice(-10);
  // 2. 早期消息由AI生成"剧情摘要"
  const earlyMessages = messages.slice(0, -10);
  const summary = await aiService.summarize(earlyMessages);
  // 3. 组装压缩后的上下文
  return `${summary}\n\n[最近对话]\n${recent.map(m => `${m.sender}: ${m.content}`).join('\n')}`;
}
```

---

## 五、Phase 2B: Combat Tracker核心

### 5.1 精简后的Combat Tracker

**只做核心功能**：
1. 先攻排序（DEX降序，同DEX掷1d100）
2. 回合切换（KP点击"下一回合"）
3. HP变化记录
4. 当前回合高亮

**延后功能**：
- 条件计时器（Phase 3）
- 范围测量（Phase 3，配合地图）
- NPC隐藏/显示细分（Phase 3）

### 5.2 前端组件

#### `CombatTracker.vue`（右侧栏/可折叠）

```
┌─────────────────────────┐
│ ⚔️ 战斗轮 第 3 轮        │
│  当前: 约翰·史密斯        │
├─────────────────────────┤
│  1. 🏃 约翰    DEX 65    │ ← 当前回合高亮+左边框
│     HP ████████░░ 12/15 │
│     [攻击] [闪避]        │
│                         │
│  2. 🧟 深潜者  DEX 55    │
│     HP ██████████ ??/?? │ ← GM看数值，玩家看??
│                         │
│  3. 🔫 玛丽    DEX 50    │
│     HP ██████░░░░  8/15 │
├─────────────────────────┤
│ [⏮] [下一回合] [⏹结束] │ ← 仅GM可见可操作
└─────────────────────────┘
```

**状态设计**：
```typescript
// combatStore.ts (Pinia)
interface CombatState {
  isActive: boolean;
  roundNumber: number;
  turnIndex: number;
  combatants: Combatant[];
}

interface Combatant {
  id: string;
  name: string;
  avatar?: string;
  initiative: number; // DEX
  initiativeRoll: number; // 同DEX时的1d100
  hp: number;
  maxHp: number;
  isNpc: boolean;
  isVisibleToPlayers: boolean;
  isCurrentTurn: boolean;
}
```

---

## 六、Phase 3: 轻量地图 + 线索Entity系统

### 6.1 地图系统（精简版）

**技术选型确认**：Fabric.js（vs PixiJS）
- COC跑团不需要DND级别的网格战术
- 核心价值是"氛围"和"线索定位"

**功能范围**：
1. 静态背景图加载
2. Token拖拽（圆形头像+名字标签）
3. 简单的KP/玩家双视角（GM看到全部，玩家只看到已揭示区域）
4. 不涉及：动态光照、复杂迷雾算法、3D地形

**迷雾简化方案**：
- GM用画笔在地图上涂抹"已揭示区域"
- 玩家视角：未揭示区域用半透明黑色蒙版覆盖
- 不需要实时同步迷雾绘制过程，只在场景加载时同步一次

### 6.2 线索Entity系统

**核心设计**：
```typescript
// 线索是"一等公民"，支持@引用和隐私层级
interface Clue {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  entityType: 'clue' | 'npc' | 'location' | 'organization' | 'event';
  privacy: 'private' | 'shared' | 'public' | 'specific_user';
  sharedWith?: string[]; // userId数组
  sourceMessageId?: string;
  mapPosition?: { x: number; y: number }; // 在地图上的位置
  createdAt: string;
}
```

**UI设计**：
- 获得线索时，聊天区弹出"卡片翻转"动画
- 线索面板支持@引用语法（如"这与@图书馆线索有关"）
- 隐私层级可视化：未分享=锁图标，已分享某人=头像图标，团队公开=地球图标

---

## 七、Phase 4: AI工程化 + 复盘系统

### 7.1 AI工程化

在Phase 2A验证有效后，投入工程化：

1. **Bull + Redis 异步队列**：AI请求入队，非阻塞房间主线程
2. **SSE 流式输出**：打字机效果，可中断
3. **Prompt Caching**：system prompt（COC规则书、战役设定）常驻缓存
4. **RAG 向量检索**：将规则书、跑团日志、战役维基建立向量索引
5. **本地模型降级**：支持Ollama，简单任务走本地，复杂任务走云端

### 7.2 复盘系统（精简版）

**只做时间线**（关系图谱延后）：
- KP右键任意Message标记为"事件"
- 事件按时间轴展示，支持"剧本时间"和"现实时间"双轴
- 支持导出为Markdown/PDF

---

## 八、被忽略的关键问题（补充）

### 8.1 种子数据审计

张一鸣指出：**"如果种子数据有错误，用户会在第一次车卡时就对平台失去信任。这比'没有战斗轮'更致命。"**

**行动项**：找一位资深COC KP做1-2天的种子数据审计，逐条核对：
- 技能基础值是否和规则书一致
- 职业点数公式是否正确
- 武器伤害公式、射程、故障率
- 信用评级资产计算公式

### 8.2 消息协议强类型化

当前`Message.metadata`是String，随着Phase增加会指数级混乱。

**行动项**（Phase 2B初期，1天内完成）：
```typescript
// 定义强类型消息协议
interface BaseMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'PLAYER' | 'GM' | 'SYSTEM' | 'AI' | 'BOT';
  messageType: 'TEXT' | 'CHECK' | 'COMBAT' | 'SCENE_CHANGE' | 'CLUE' | 'AI_DECISION';
  content: string;
  createdAt: string;
}

interface CheckMessage extends BaseMessage {
  messageType: 'CHECK';
  payload: {
    skillName: string;
    targetValue: number;
    rollResult: number;
    successLevel: 'critical' | 'success' | 'failure' | 'fumble';
    bonusDice: number[];
    penaltyDice: number[];
  };
}

interface CombatMessage extends BaseMessage {
  messageType: 'COMBAT';
  payload: {
    action: 'START' | 'NEXT_TURN' | 'END' | 'HP_CHANGE';
    roundNumber?: number;
    turnIndex?: number;
    combatantId?: string;
    delta?: number;
  };
}

interface AiDecisionMessage extends BaseMessage {
  messageType: 'AI_DECISION';
  payload: {
    level: 'L1' | 'L2' | 'L3';
    action: string;
    result: string;
    suggestionId?: string; // L3时关联待审核ID
  };
}
```

### 8.3 数据导出和迁移

跑团是长期承诺，用户最害怕数据丢失。

**行动项**：
- Phase 2A期间实现"战役数据导出JSON"功能
- 定期自动备份策略（每天凌晨导出所有活跃战役）

---

## 九、风险矩阵（更新）

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| AI API成本过高 | 高 | 中 | 支持Ollama本地降级；Prompt缓存；非关键功能可关闭 |
| 种子数据错误导致信任崩塌 | 高 | 中 | Phase 2A初期完成数据审计；建立社区反馈渠道 |
| Phase 2A验证失败（AI无用） | 高 | 低 | 2周快速验证，失败则 pivot 回纯VTT方向 |
| 多客户端状态同步冲突 | 高 | 中 | 战斗轮和Token以服务端为唯一来源；乐观更新+服务端校验 |
| Fabric.js长期维护 | 中 | 低 | 锁定v5+；地图数据用自描述JSON，不和内部格式耦合 |
| 消息协议混乱 | 中 | 高 | Phase 2B初期强类型化，现在做是1天，以后是1周 |

---

## 十、近期执行顺序（未来2周）

**Week 1**：
1. **Day 1-2**：种子数据审计（找资深KP核对）
2. **Day 2-3**：消息协议强类型化（TypeScript union type + Zod validation）
3. **Day 3-5**：前端UI快速改进（检定动画 + 技能折叠 + hover提示 + 暗色变量）

**Week 2**：
1. **Day 1-5**：AI KP原型开发（最简版：OpenAI API封装 + AiPanel.vue + L1/L2基础规则）
2. **并行**：Combat Tracker前端原型（mock数据驱动）

---

## 十一、张一鸣评审核心观点（附录）

> "Phase划分的问题不在技术，在节奏。你把'建立壁垒'的事放得太晚，把'追赶竞品'的事放得太早。"

> "AI不应该在Phase 5。等AI上线时你们可能已经失去了'先定义品类'的窗口期。"

> "先小验证，再押大注。你们现在反过来，把验证放在第30周以后，风险很大。"

> "COC七版的战斗不依赖网格地图。你们花8-10周做Fabric.js地图+迷雾系统，ROI可能被高估了。"

> "插件系统应该等到有至少100个活跃战役、有开发者在GitHub上提feature request的时候再做。"

> "如果AI的每个建议都要人工审核，那AI的价值就不是'节省KP时间'，而是'给KP提供灵感'——这两个产品的用户价值完全不同。"

> "建议尽早明确这个产品的核心假设：AI是副驾驶，还是自动驾驶？"

---

*本文档已整合 VTT调研、设计原则、前端设计、张一鸣CTO评审四方输入。建议保存后作为Phase 2A-2B的开发输入。*
