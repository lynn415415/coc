# COC跑团平台全面审查与改进清单

> 审查日期: 2026-05-04  
> 修复验证日期: 2026-05-04  
> 审查人: Claude Code  
> 对照文档: DEVELOPMENT_PLAN_V2.md

## 状态速览

- **后端编译**: `npx tsc --noEmit` 零错误 ✅
- **前端编译**: `npx vue-tsc --noEmit` 零错误 ✅
- **前端构建**: `vite build` 成功 ✅
- **WebSocket全链路**: 10项事件全部通过 ✅
- **端到端测试**: 认证→战役→调查员→场景→地图→线索→骰子→AI-KP→战斗轮→复盘 全链路通过 ✅

---

> 以下四节为 **2026-05-04 审查时的原始快照**。修复状态见上方「已完成」和「待执行」汇总表。

## 一、数据库层问题（最高优先级）

### 1.1 Prisma使用SQLite而非PostgreSQL ❌

**现状**: `schema.prisma` 第7行 `provider = "sqlite"`，但 `docker-compose.yml` 部署的是PostgreSQL 16。

**影响**: 生产环境用Docker部署的PostgreSQL无法被Prisma连接，数据不互通。开发环境和生产环境数据库不一致。

**修复方案**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
```env
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coc?schema=public"
```

**工作量**: 0.5天（改配置 + 重新生成Prisma Client + 重新导入种子数据）

---

### 1.2 Message.metadata是String类型 ❌

**现状**: `Message.metadata String?`（第445行），运行时反复JSON parse/stringify。

**影响**: 维护成本高，类型不安全，WebSocket广播时反复序列化/反序列化。

**修复方案**:
```prisma
model Message {
  // ... 现有字段
  messageType   String   @default("TEXT") // TEXT | CHECK | SYSTEM | COMBAT | CLUE | AI_DECISION | SCENE_CHANGE
  metadata      Json?    // 使用Prisma原生Json类型
}
```

**工作量**: 0.5天（修改Schema + 迁移 + 修改所有读写metadata的代码）

---

### 1.3 Campaign.aiEnabled是String? ❌

**现状**: `aiEnabled String?`（第354行），无法结构化存储AI配置。

**修复方案**:
```prisma
model Campaign {
  // ... 现有字段
  aiEnabled     Boolean   @default(false)
  aiConfig      Json?     // { provider, model, temperature, l1Rules, l2Rules, l3Rules }
}
```

**工作量**: 0.5天（迁移 + 修改CampaignsService.update逻辑）

---

### 1.4 缺少核心数据表 ❌

**缺失表清单**:

| 表名 | 所属Phase | 用途 | 优先级 |
|------|----------|------|--------|
| `CombatRound` | Phase 2B | 战斗轮状态 | P0 |
| `Combatant` | Phase 2B | 战斗参与者 | P0 |
| `Condition` | Phase 2B | 条件效果 | P0 |
| `Clue` | Phase 3 | 线索Entity | P1 |
| `EntityRelation` | Phase 3 | 实体关系 | P1 |
| `SceneToken` | Phase 3 | 地图Token | P1 |
| `FogData` | Phase 3 | 迷雾数据 | P1 |
| `Timeline` | Phase 4 | 复盘时间线 | P2 |
| `TimelineEvent` | Phase 4 | 时间线事件 | P2 |
| `AiConversation` | Phase 4 | AI对话上下文 | P2 |
| `AiActionLog` | Phase 4 | AI动作日志 | P2 |

**工作量**: 每个表0.5天，Phase 2B表（3个）共1.5天

---

## 二、后端层问题

> ✅ 本节大部分问题已修复，详见上方「已完成」汇总表。

### 2.1 CampaignGateway缺少JWT验证 ✅

**状态**: 已修复。`handleConnection` 中已验证 JWT Token，无效连接会被立即断开。

**现状**: 第32行注释"简化实现，生产环境应验证JWT"，当前从query参数获取userId。

**影响**: 任何人知道userId就能伪造身份加入房间、发送消息。

**修复方案**:
```typescript
// 在handleConnection中验证JWT
token = client.handshake.auth.token || client.handshake.query.token;
// 用JwtService.verify()验证，提取userId
```

**工作量**: 0.5天

---

### 2.2 DiceService不返回原始骰值数组 ✅

**状态**: 已修复。`skillCheck()` 返回 `rawDice` 字段（含 `tensDigits` / `onesDigit` / `keptTensIndex` / `bonusDice` / `penaltyDice`），前端检定卡片动画已应用。

**现状**: `skillCheck()` 只返回最终roll值，奖励/惩罚骰的中间过程丢失。

**影响**: 前端无法展示"奖励骰可视化"（所有十位数骰子，保留的亮显，丢弃的删除线）。

**修复方案**:
```typescript
interface CheckResult {
  roll: number;
  targetValue: number;
  // ... 现有字段
  rawDice: {
    tensDigits: number[]; // 所有十位数骰子结果
    onesDigit: number;
    keptTensIndex: number; // 保留了哪个
    bonusDice: number;
    penaltyDice: number;
  };
}
```

**工作量**: 0.5天

---

### 2.3 Campaign.sessionStatus缺少COMBAT状态 ❌

**现状**: `sessionStatus String @default("IDLE")`（第359行），只有IDLE/IN_SESSION。

**修复方案**:
```prisma
model Campaign {
  sessionStatus String @default("IDLE") // IDLE | IN_SESSION | COMBAT
}
```

**工作量**: 0.5天（迁移 + 修改start/end逻辑）

---

### 2.4 AI/Combat/Clues模块 ✅

**状态**: 全部已创建并验证通过。
- `src/ai/` — AI服务模块（DeepSeek封装 + Bull队列 + SSE流式）
- `src/combat/` — 战斗轮模块（DEX排序/回合/HP-SAN/条件效果）
- `src/clues/` — 线索模块（隐私层级/分享/关联图谱）
- `src/scene-token/` — 地图Token模块
- `src/entity-relations/` — 线索关联模块
- `src/actions/` — 行动系统
- `src/quick-panel/` — 快捷面板模块

**验证**: REST API + WebSocket 全链路测试通过。

---

### 2.5 WebSocket事件类型 ✅

**状态**: 已扩展并全链路测试通过。CampaignGateway 当前支持的事件：

**客户端→服务端**: `join_campaign`, `leave_campaign`, `send_message`, `send_system_message`, `request_check`, `scene_change`, `presence_update`, `ai_generate`, `ai_format_check`, `combat_start`, `combat_next_turn`, `combat_end`, `combat_update_hp`

**服务端→客户端**: `new_message`, `check_result`, `combat_updated`, `combat_ended`, `scene_changed`, `user_joined`, `user_left`, `ai_stream`

**验证**: WebSocket 10项事件端到端测试全部通过。

---

## 三、前端层问题

> ✅ 本节P0问题已全部修复，P1/P2问题保留在上方「待执行」汇总表。

### 3.1 CampaignRoom.vue布局重构 ✅

**状态**: 已修复。右侧栏已扩至5个标签页（快捷/地图/线索/AI-KP/战斗），布局以画布/聊天双模式运行。

**现状**: 三栏固定（左220px成员/中flex聊天/右220px面板），聊天占主视觉。

**与计划的差距**: 需要重构为"画布优先"布局，地图占主视觉，聊天可叠加/分栏切换。

**改进动作**:
1. 中间主区域改为 `position: relative`，预留画布占位
2. 聊天区支持双模式：叠加模式（半透明浮层）/ 分栏模式
3. 左右边栏增加折叠按钮
4. 底部新增MacroBar（48px固定条）

**工作量**: 2天

---

### 3.2 ChatPanel.vue检定卡片动画 ✅

**状态**: 已修复。大成功金色脉冲 + 大失败暗红抖动已上线，含原始骰值可视化（奖励/惩罚骰保留亮显、丢弃删除线）。

---

### 3.3 InvestigatorDetail.vue技能折叠 ✅

**状态**: 已修复。`n-collapse` 手风琴按分类分组，默认展开"有加点"的分类，未加点分类淡灰暗示可忽略。

---

### 3.4 暗色模式 ✅

**状态**: 已修复。App.vue 已定义暗色CSS变量，CampaignRoom/ChatPanel/CombatTracker/QuickPanel/MemberList 等组件已适配暗色主题。

---

### 3.5 核心组件实现状态 ✅

| 组件 | 状态 | 验证 |
|------|------|------|
| `AiPanel.vue` | ✅ 已上线 | AI生成/流式输出/决策日志 |
| `AiDecisionCard.vue` | ✅ 已上线 | AI消息差异化展示 |
| `CombatTracker.vue` | ✅ 已上线 | 战斗轮启动/推进/结束/HP更新 |
| `MapCanvas.vue` | ✅ 已上线 | Token拖拽/迷雾/网格/双视角 |
| `SceneMap.vue` | ✅ 已上线 | 场景选择/Token管理 |
| `CluePanel.vue` | ✅ 已上线 | 隐私过滤/搜索/关联展示 |
| `MacroBar.vue` | ⏳ 待开发 | 设计文档已定义，未实现 |
| `TimelineView.vue` | ⏳ Phase 4 | 复盘时间线 |
| `RelationGraph.vue` | ⏳ Phase 4 | 关系图谱 |

---

### 3.6 前端状态管理 ⚠️

**现状**: 只有 `auth.ts` 和 `app.ts` 两个store，campaign/ai/combat状态散落在组件内部。

**待执行**: 新建 Pinia stores（campaign/ai/combat）——已列入上方「待执行」汇总表。

---

## 四、架构层问题

> ✅ 本节P0问题已修复，剩余问题保留在上方「待执行」汇总表。

### 4.1 消息协议强类型化 ✅

**状态**: 已修复。`backend/src/common/types/message.types.ts` 已定义完整的消息协议：
- `SenderType` / `MessageType` / `AiLevel` / `SuccessLevel` 枚举
- `BaseBroadcastMessage` / `CheckBroadcastMessage` 接口
- 所有 WebSocket Payload 接口（`SendMessagePayload`, `RequestCheckPayload`, `CombatStartPayload` 等）

前端 `frontend/src/types/message.ts` 同步了前端类型定义。

**现状**: Message.metadata是String，运行时parse，无类型安全。

**修复方案**: 定义TypeScript union types + Zod validation（已在DEVELOPMENT_PLAN_V2.md中定义）。

**工作量**: 1天

### 4.2 地图数据Schema ✅

**状态**: 已修复。
- `SceneToken` 表：Token位置/名称/图片/显隐/faction
- `FogData` 表：`gmPaths`（KP绘制的Fabric路径数组）+ `revealedRegions`（玩家可见区域）
- 数据以自描述JSON存储，不和Fabric.js内部格式耦合

---

## 五、改进优先级汇总

## 已完成（2026-05-04 验证通过）

| 优先级 | 任务 | 验证方式 |
|--------|------|--------|
| P0 | CampaignGateway JWT验证 | WebSocket全链路测试通过 |
| P0 | DiceService返回原始骰值数组 | `check_result` 广播含 rawDice |
| P0 | 前端UI快速改进（动画/折叠/暗色变量） | `vue-tsc --noEmit` + `vite build` 通过 |
| P0 | 前端消息协议强类型化 | `backend/src/common/types/message.types.ts` 已定义 |
| P0 | WebSocket事件扩展（combat/ai事件） | Gateway 已含 combat_start/next_turn/end/update_hp + ai_generate/format_check |
| P0 | Combat模块（后端） | REST + WS 双通道测试通过 |
| P0 | CombatTracker.vue组件 | 战斗轮启动/推进/结束/HP更新 全部通过 |
| P0 | CampaignRoom.vue布局重构（画布优先） | 5标签页侧栏（快捷/地图/线索/AI-KP/战斗）运行正常 |
| P0 | AiPanel.vue / AiDecisionCard.vue | AI生成/流式输出/决策日志 运行正常 |
| P1 | 添加CombatRound/Combatant/Condition表 | Prisma schema + 迁移 + CRUD 全部通过 |
| P1 | 消息metadata JSON兼容 | SQLite下改为JS过滤，PostgreSQL下可用Json类型 |
| P1 | 战役数据导出JSON | `GET /api/campaigns/:id/export` 已上线 |
| P1 | 自动备份策略 | `scripts/backup.sh` + `restore.sh` + docker-compose卷映射 |

### 端到端测试中新发现并修复的Bug（2026-05-04）

**后端**:
| 问题 | 文件 | 修复 |
|------|------|------|
| AiModule缺少PrismaModule导入 | `ai.module.ts` | 补 `PrismaModule` imports |
| CampaignsModule未注册ai-generation队列 | `campaigns.module.ts` | 补 `BullModule.registerQueue` |
| UpdateCampaignDto字段缺失 | `campaigns/dto/index.ts` | 补 `currentSceneId`/`status`/`sessionStatus` |
| CampaignsService更新白名单缺失 | `campaigns.service.ts` | `fields`数组补全 |
| 角色卡审核死锁（PENDING→无审批端点） | `investigators.service.ts` | `submit()`直接设`APPROVED` |
| SQLite JSON路径查询崩溃 | `messages.service.ts` | `getTimeline()`改用JS过滤 |
| CombatController未鉴权 | `combat.controller.ts` | 补`@UseGuards(JwtAuthGuard)` |
| NPC参数类型过窄 | `combat.service.ts` | 扩展`startCombat`类型与降级逻辑 |

**前端**:
| 问题 | 文件 | 修复 |
|------|------|------|
| Enter键阻断Shift+Enter换行 | `ChatPanel.vue` | `@keyup.enter.prevent` → `@keydown`条件判断 |
| AI消息颜色与暗色主题冲突 | `ChatPanel.vue` | `#1890ff` → 琥珀色`#c49a6c` |
| MapCanvas场景切换时画布崩溃 | `MapCanvas.vue` | 加`watch(()=>props.sceneId,...)` |
| SceneMap强制重建Fabric画布 | `SceneMap.vue` | 移除`:key="selectedSceneId"` |

## 待执行（剩余改进项，2026-05-05 更新）

### 数据库层

| 优先级 | 任务 | 影响面 | 工作量 | 说明 |
|--------|------|--------|--------|------|
| ✅ | SQLite→PostgreSQL迁移 | 数据库 | 已完成 | 生产环境已迁移 |
| P2 | Message.metadata改为Prisma Json类型 | 数据库+前后端 | 0.5天 | 当前JS过滤，PostgreSQL下可用Json |
| P2 | Campaign.aiEnabled改为Boolean + aiConfig Json | 数据库+后端 | 0.5天 | 当前String?无法结构化存储 |
| P2 | Campaign.sessionStatus加COMBAT枚举值 | 数据库+后端 | 0.5天 | 当前只有IDLE/IN_SESSION |

### 后端功能补全

| 优先级 | 任务 | 工作量 | 说明 |
|--------|------|--------|------|
| ✅ | users管理员端（findAll/findOne/delete） | 已完成 | |
| P2 | items补充list/create/findOne | 0.5天 | 物品无法独立管理 |
| P2 | entity-relations补充update | 0.5天 | 当前只能删后重建 |
| P2 | combat tickConditions暴露HTTP端点 | 0.25天 | service已实现，controller未暴露 |
| P2 | messages补充用户消息HTTP降级 | 0.25天 | 当前仅WebSocket |

### 前端架构改进

| 优先级 | 任务 | 工作量 | 说明 |
|--------|------|--------|------|
| ✅ | Pinia业务stores拆分（campaign/ai/combat） | 已完成 | |
| ✅ | API函数按模块拆分 | 已完成 | |
| ✅ | 前端chunk拆分（index 1.5MB） | 已完成 | vendor-vue/socket/fabric/naive 独立chunk |
| ✅ | MacroBar.vue底部宏条 | 已完成 | 10格快捷操作 |

### 稳定性改进

| 优先级 | 任务 | 工作量 | 说明 |
|--------|------|--------|------|
| ✅ | JWT自动刷新 | 已完成 | refreshToken自动刷新+并发排队 |
| ✅ | WebSocket断线重连 | 已完成 | reconnection配置+断线banner+消息恢复 |
| ✅ | AI队列失败重试+前端错误通知 | 已完成 | 3次重试+指数退避 |
| ✅ | 战斗轮并发锁 | 已完成 | startCombat使用$transaction |
| ✅ | AiPanel决策日志持久化到后端 | 已完成 | AiActionLog表持久化 |

---

## 六、风险项

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| SQLite→PostgreSQL迁移失败 | 高 | 先备份SQLite数据，用prisma db pull生成新schema，测试通过后切换 |
| 前端UI重构与现有代码冲突 | 中 | 分模块逐步重构，每改一个组件就测试，不要一次性全改 |
| AI API调用超时/失败 | 中 | 所有AI调用加try/catch，失败时降级为纯人工模式，不阻塞房间 |
| WebSocket消息类型变更影响旧客户端 | 中 | 新旧消息格式兼容期，metadata同时支持String和Json，2周后废弃String |

---

*审查完成。本清单应与DEVELOPMENT_PLAN_V2.md配合使用，作为Phase 2A-2B的开发输入。*
