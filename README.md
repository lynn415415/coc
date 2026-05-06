# COC跑团平台

## 技术栈
- **前端**：Vue 3 + TypeScript + Pinia + Vite + Naive UI + Fabric.js v6 + Socket.io-client
- **后端**：Node.js + NestJS + TypeScript + Prisma
- **数据库**：PostgreSQL 16 + Redis 7
- **文件存储**：MinIO
- **AI**：DeepSeek v4 pro（OpenAI/Anthropic兼容接口可切换）
- **部署**：Docker Compose

## 项目结构
```
COC-Platform/
├── backend/                 # NestJS后端（17个模块）
│   ├── src/
│   │   ├── auth/            # 认证模块（注册/登录/JWT/RefreshToken）
│   │   ├── users/           # 用户模块
│   │   ├── investigators/   # 角色卡模块（创建/计算衍生属性/审核）
│   │   ├── skills/          # 技能模块
│   │   ├── occupations/     # 职业模块
│   │   ├── dice/            # 骰子引擎（d100/属性Roll点/检定/奖励惩罚骰）
│   │   ├── campaigns/       # 跑团模块（创建/招募/审批/角色卡绑定/WebSocket Gateway）
│   │   ├── scenes/          # 场景模块（CRUD/迷雾数据）
│   │   ├── messages/        # 消息模块（文字/检定/战斗/AI决策/场景切换）
│   │   ├── checks/          # 检定模块
│   │   ├── clues/           # 线索模块（隐私层级/分享/关联图谱）
│   │   ├── combat/          # 战斗轮模块（DEX排序/回合/HP-SAN追踪/状态效果）
│   │   ├── ai/              # AI-KP模块（场景描述/NPC回复/检定格式化/动作建议）
│   │   ├── actions/         # 行动系统
│   │   ├── items/           # 物品系统
│   │   ├── weapons/         # 武器配置库
│   │   ├── armors/          # 防具配置库
│   │   ├── vehicles/        # 载具配置库
│   │   ├── asset-references/# 资产参考
│   │   ├── scene-token/     # 地图Token（增删改查/批量位置同步）
│   │   ├── entity-relations/# 线索关联（关系图谱/正向反向查询）
│   │   ├── quick-panel/     # 快捷面板
│   │   ├── common/          # 公共守卫/装饰器
│   │   ├── prisma/          # Prisma服务
│   │   └── main.ts          # 入口
│   ├── prisma/
│   │   ├── schema.prisma    # 数据库Schema（26张表）
│   │   └── seed.ts          # 种子数据
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Vue 3前端（8个页面+10个组件）
│   ├── src/
│   │   ├── views/           # 页面
│   │   │   ├── Home.vue
│   │   │   ├── Login.vue / Register.vue
│   │   │   ├── Investigators.vue
│   │   │   ├── InvestigatorCreate.vue（车卡向导）
│   │   │   ├── InvestigatorDetail.vue（技能折叠/hover规则）
│   │   │   ├── CampaignList.vue
│   │   │   ├── CampaignDetail.vue（成员管理/角色卡绑定）
│   │   │   ├── CampaignRoom.vue（跑团房间/5标签页侧栏）
│   │   │   └── ConfigLibrary.vue（武器/防具/载具配置库）
│   │   ├── components/      # 组件
│   │   │   ├── ChatPanel.vue（检定卡片动画/原始骰值可视化）
│   │   │   ├── AiPanel.vue（AI-KP控制面板/L1-L4开关/决策日志）
│   │   │   ├── AiDecisionCard.vue（AI决策消息卡片）
│   │   │   ├── CombatTracker.vue（战斗轮/回合/DEX排序）
│   │   │   ├── QuickPanel.vue（快捷检定）
│   │   │   ├── MemberList.vue（成员列表/KP调查员分组/属性直展）
│   │   │   ├── MapCanvas.vue（Fabric.js地图画布/迷雾/Token）
│   │   │   ├── SceneMap.vue（地图面板/Token管理）
│   │   │   ├── ScenePanel.vue（场景管理/线索关联/触发条件）
│   │   │   ├── CluePanel.vue（线索面板/隐私过滤/关联展示）
│   │   │   ├── MacroBar.vue（底部快捷宏条10格）
│   │   │   ├── RelationGraph.vue（线索关联SVG可视化）
│   │   │   ├── ReviewPanel.vue（复盘时间线）
│   │   │   └── QuickLogin.vue（测试账号快速登录）
│   │   ├── router/ / stores/ / api/
│   │   ├── App.vue（暗色模式CSS变量）
│   │   └── main.ts
│   ├── Dockerfile + nginx.conf
│   └── package.json
├── docs/
│   ├── DEVELOPMENT_PLAN_V2.md  # 开发计划V2.1
│   └── PLATFORM_AUDIT_IMPROVEMENTS.md
├── research/                    # 调研报告
├── docker-compose.yml
└── README.md
```

## 开发阶段

### Phase 1: 基础骨架 ✅（2026-05-03）
- [x] 用户系统（注册/登录/JWT/RefreshToken/权限守卫）
- [x] 角色卡CRUD/衍生属性计算/车卡向导
- [x] 技能/职业/骰子引擎
- [x] 配置库系统（武器/防具/载具/资产参考）
- [x] 云服务器部署 + 种子数据导入

### Phase 2: 跑团核心 ✅（2026-05-04）
- [x] 跑团房间（创建/加入/招募/审批/角色卡绑定解绑）
- [x] WebSocket实时通信（JWT验证/房间广播）
- [x] AI-KP集成（DeepSeek v4 pro, L1-L4自动化层级）
- [x] 战斗轮系统（CombatTracker/DEX排序/HP追踪/状态效果）
- [x] 线索模块（public/shared/private/specific_user隐私层级）

### Phase 3: 地图+线索 ✅（2026-05-04）
- [x] Fabric.js v6地图画布（Token拖拽/迷雾绘制擦除/KP玩家双视角）
- [x] SceneToken/FogData/EntityRelation后端模块
- [x] 线索面板（隐私可视化/搜索过滤/关联图谱）
- [x] CampaignRoom标签页扩至5个（快捷/地图/线索/AI-KP/战斗）

### Phase 4: 剧情闭环与稳定性 ✅（2026-05-05）
- [x] P0稳定性修复（JWT自动刷新/WS断线重连/AI队列重试/战斗轮并发锁）
- [x] SQLite→PostgreSQL迁移 + Pinia stores拆分 + API模块拆分 + Vendor chunk优化
- [x] 真SSE流式输出 + Function Calling工具定义
- [x] MacroBar底部快捷宏条（10格）+ RelationGraph线索关联可视化
- [x] 成员面板重写（KP/调查员分组，属性全展开，KP踢人+审核）
- [x] 场景面板重构（场景卡片+关联线索+触发条件，KP CRUD+切换）
- [x] 公开跑团发现（CampaignList发现区域 + GET /campaigns/discover）

### Phase 5: 插件/Solo/Bot/PDF（规划中）
- [ ] 插件架构（coc-module.json + Hooks）
- [ ] Solo模式 + Bot桥接 + PDF导出

## 在线访问
- **前端**：http://118.145.110.165
- **后端API**：http://118.145.110.165/api
- **GitHub**：https://github.com/lynn415415/coc.git

## API端点

### 认证 & 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/refresh | 刷新Token |
| GET | /api/users/me | 获取当前用户 |

### 角色卡 & 配置库
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/investigators | 角色卡列表/创建 |
| GET/PATCH | /api/investigators/:id | 角色卡详情/更新 |
| GET | /api/skills | 技能列表 |
| GET | /api/occupations | 职业列表 |
| POST | /api/dice/roll | 基础骰子 |
| POST | /api/dice/attributes | 属性Roll点 |
| POST | /api/dice/check | 技能检定 |

### 跑团 & 房间
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/campaigns | 跑团列表/创建 |
| GET | /api/campaigns/discover | 发现公开跑团 |
| GET | /api/campaigns/:id | 跑团详情 |
| POST | /api/campaigns/:id/join | 申请加入 |
| POST | /api/campaigns/:id/start | 开始跑团 |
| POST | /api/campaigns/:id/end | 结束跑团 |
| POST | /api/campaigns/:id/bind-investigator | 绑定角色卡 |
| POST | /api/campaigns/:id/unbind-investigator | 解绑角色卡 |
| GET | /api/campaigns/:id/export | 导出战役数据JSON（KP专属） |
| GET | /api/campaigns/:id/messages | 消息列表（REST降级） |

### 场景 & 地图
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/campaigns/:id/scenes | 场景列表/创建 |
| GET/PATCH | /api/scenes/:id | 场景详情/更新(含背景图) |
| GET/POST | /api/scenes/:id/tokens | Token列表/创建 |
| PATCH | /api/scenes/:id/tokens/batch | Token批量位置更新 |
| DELETE | /api/scenes/:id/tokens/:tokenId | 删除Token |
| GET/PUT | /api/scenes/:id/fog | 迷雾数据读写 |

### 战斗轮
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/combat/:campaignId | 获取当前战斗 |
| POST | /api/combat/:campaignId/start | 开始战斗 |
| POST | /api/combat/:campaignId/next-turn | 下一回合 |
| POST | /api/combat/:campaignId/end | 结束战斗 |
| POST | /api/combat/:campaignId/tick-conditions | 推进条件计时 |
| PATCH | /api/combat/combatant/:id/hp | 更新HP |
| PATCH | /api/combat/combatant/:id/san | 更新SAN |
| PATCH | /api/combat/combatant/:id/mp | 更新MP |
| POST | /api/combat/combatant/:id/condition | 添加条件 |
| DELETE | /api/combat/condition/:id | 移除条件 |

### 线索 & 关联
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/campaigns/:id/clues | 线索列表/创建 |
| PATCH | /api/campaigns/:id/clues/:clueId | 更新线索 |
| DELETE | /api/campaigns/:id/clues/:clueId | 删除线索 |
| POST | /api/campaigns/:id/clues/:clueId/share | 分享线索 |
| GET/POST | /api/campaigns/:id/relations | 关联列表/创建 |
| GET | /api/campaigns/:id/relations/entity/:entityId | 实体关联查询 |

### AI
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ai/chat | AI对话 |
| POST | /api/ai/scene | 生成场景描述 |
| POST | /api/ai/npc | 生成NPC回复 |
| POST | /api/ai/format-check | 格式化检定结果 |
| POST | /api/ai/suggest | AI动作建议 |

### 复盘
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/campaigns/:id/timeline | 时间线查询 |
| GET | /api/campaigns/:id/export-markdown | 导出Markdown复盘报告 |
| POST | /api/messages/:id/mark-event | 标记消息为事件 |

### WebSocket 事件
| 事件 | 方向 | 说明 |
|------|------|------|
| join_campaign | 客户端→服务端 | 加入房间 |
| send_message | 客户端→服务端 | 发送消息 |
| request_check | 客户端→服务端 | 请求检定 |
| combat_start/next_turn/end/update_hp | 客户端→服务端 | 战斗操作 |
| ai_generate/ai_format_check | 客户端→服务端 | AI操作 |
| new_message | 服务端→客户端 | 新消息广播 |
| check_result | 服务端→客户端 | 检定结果 |
| combat_updated/combat_ended | 服务端→客户端 | 战斗状态 |
| scene_changed | 服务端→客户端 | 场景切换 |
| user_joined/user_left | 服务端→客户端 | 成员上下线 |

---

## 本地开发

### 环境要求
- Node.js 22+
- npm 10+
- Redis 7+（或 `redis-memory-server` 用于开发）

### 启动后端
```bash
cd backend
npm install
npx prisma generate
npm run start:dev    # http://localhost:3000
```

### 启动前端
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### 类型检查
```bash
cd backend && npx tsc --noEmit
cd frontend && npx vue-tsc --noEmit
```

### Docker部署
```bash
docker compose up -d
```
