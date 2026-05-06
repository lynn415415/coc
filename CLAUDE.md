# CLAUDE.md — COC跑团平台

> AI agent 项目上下文。人类同事请读 README.md 和 docs/。

## 项目定位
COC七版在线跑团全功能平台。核心差异化：AI替代KP重复劳动。

## 技术栈
- 前端：Vue 3 + TypeScript + Naive UI + Fabric.js v6 + Socket.io-client + Pinia + Vite
- 后端：NestJS + TypeScript + Prisma + PostgreSQL + Redis + Socket.io
- AI：DeepSeek v4 pro（Anthropic兼容接口），可切换OpenAI
- 部署：Docker Compose，公网 118.145.110.165

## 项目结构
```
backend/src/ — NestJS 17个模块
  campaigns/ — 跑团CRUD+WebSocket Gateway+公开跑团发现(/discover)+角色卡属性完整返回
  ai/ — AI-KP服务（DeepSeek，SSE真流式+Function Calling+决策日志持久化）
  combat/ — 战斗轮（DEX排序/回合/HP-SAN/状态效果，$transaction并发安全）
  clues/ — 线索CRUD+sceneId关联+triggerCondition+隐私过滤+KP全权编辑
  scene-token/ — 地图Token CRUD+批量位置
  scenes/ — 场景CRUD+迷雾
  entity-relations/ — 线索关联图谱
  dice/ — COC骰子引擎（d100/奖励惩罚骰/大成功大失败）
  investigators/skills/occupations/ — 角色卡体系
  items/weapons/armors/vehicles/ — 装备体系（配置库+实例）
  auth/users/ — 认证+用户（含管理员findAll/findOne/delete）

frontend/src/
  views/ — 8个页面（CampaignRoom最复杂：WebSocket+6标签页侧栏+MacroBar）
  components/ — 14个组件
    MapCanvas.vue — Fabric.js v6画布，注意v6 API差异
    ChatPanel.vue — 聊天+检定卡片动画
    AiPanel.vue — AI-KP控制面板（L1-L4开关+决策日志）
    CombatTracker.vue — 战斗轮UI
    CluePanel.vue — 线索面板（含RelationGraph关联图谱）
    MacroBar.vue — 底部快捷宏条（10格/右键清除）
    RelationGraph.vue — 线索关联可视化（SVG力导向图）
    ScenePanel.vue — 场景管理面板（场景CRUD+线索关联+触发条件+切换同步地图）
    MemberList.vue — 成员列表（KP/调查员分组，属性数值直展，KP踢人+审核）
  stores/ — 5个Pinia store（auth/app/campaign/ai/combat）
  api/ — 8个模块API（auth/campaigns/investigators/combat/scenes/clues/ai/config）
  types/ — 2个类型文件（message/campaign）
```

## 关键约定
- 所有WebSocket事件以DB为唯一来源，WS仅做通知
- fabric v6 API：`FabricImage.moveTo()` 替代 `canvas.sendToBack()`；Group自定义属性用 `as any`
- `v-model:show` 不能绑定计算表达式（如 `!!ref`），改用 `:show` + `@update:show`
- 前端 `noUnusedLocals: true`，模板编译失败会导致所有变量被误报为unused
- 数据库已迁移到PostgreSQL，本地开发需运行PG或Docker（docker compose up postgres）
- AI SSE流式优先，失败降级为伪流式（先完整获取再分块推送）
- JWT 401时自动用refreshToken刷新，并发请求排队等待刷新完成
- 战斗轮startCombat使用$transaction保证并发安全
- AI队列3次重试，指数退避（2s/4s/8s）

## 常用命令
```bash
# 后端
cd backend && npm run start:dev     # 开发启动（端口3000）
npx tsc --noEmit                    # 类型检查
npx prisma generate                 # 生成Prisma客户端
npx prisma migrate dev              # 数据库迁移（需PostgreSQL运行中）

# 前端
cd frontend && npm run dev          # 开发启动（端口5173）
npx vue-tsc --noEmit               # 类型检查（必须cd到frontend目录）
npm run build                       # 生产构建

# Docker部署
docker compose up -d                # 启动全部服务
```

## 当前状态
Phase 1-4 核心功能已完成（2026-05-05）。剧情闭环功能已上线（成员角色卡属性直展/KP踢人审核/场景管理+线索关联+触发条件/公开跑团发现）。Phase 5（插件/Solo/Bot/PDF）规划中。

## 最近新增（2026-05-05）
- 成员面板重写：KP/调查员分组，属性全展开（STR/CON/DEX等），无需"查看"跳转
- 场景面板重构：场景卡片+关联线索+触发条件，KP新建/编辑/删除/切换
- 公开跑团发现：CampaignList "发现跑团"区域 + GET /campaigns/discover
- 线索关联场景：Clue.sceneId + triggerCondition
- 线索权限：KP可编辑/删除所有线索
- 去掉成员端绑定/更换角色卡（由KP踢出+重新加入替代）
