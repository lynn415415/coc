# COC跑团平台

## 技术栈
- **前端**：Vue 3 + TypeScript + Pinia + Vite + Naive UI
- **后端**：Node.js + NestJS + TypeScript + Prisma
- **数据库**：PostgreSQL 16 + Redis 7
- **文件存储**：MinIO
- **部署**：Docker Compose

## 项目结构
```
COC-Platform/
├── backend/                 # NestJS后端
│   ├── src/
│   │   ├── auth/            # 认证模块（注册/登录/JWT）
│   │   ├── users/           # 用户模块
│   │   ├── investigators/   # 角色卡模块（创建/计算衍生属性/审核）
│   │   ├── skills/          # 技能模块
│   │   ├── occupations/     # 职业模块
│   │   ├── dice/            # 骰子引擎（d100/属性Roll点/检定）
│   │   ├── prisma/          # Prisma服务
│   │   └── main.ts          # 入口
│   ├── prisma/
│   │   ├── schema.prisma    # 数据库Schema（18张表）
│   │   └── seed.ts          # 种子数据（技能/职业/武器/防具/恐惧症/躁狂症）
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Vue 3前端
│   ├── src/
│   │   ├── views/           # 页面
│   │   │   ├── Home.vue
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── Investigators.vue
│   │   │   ├── InvestigatorCreate.vue
│   │   │   ├── InvestigatorDetail.vue
│   │   │   └── Campaigns.vue
│   │   ├── router/
│   │   ├── stores/
│   │   ├── api/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Phase 1 已完成（2026-05-03）
- [x] 用户系统（注册/登录/JWT/RefreshToken/权限守卫）
- [x] 角色卡基础CRUD（基础信息/八大属性）
- [x] 衍生属性自动计算（HP/SAN/MP/MOV/DB/Build/年龄补正）
- [x] 技能系统（内置60+技能，种子数据已导入）
- [x] 职业系统（内置20个常用职业，种子数据已导入）
- [x] 车卡向导（4步：基础信息→Roll属性→职业选择→背景）
- [x] 骰子引擎（d100/属性Roll点/检定判定/奖励惩罚骰/幸运/SAN）
- [x] 前端基础页面（首页/登录/注册/角色卡列表/创建/详情）
- [x] 云服务器部署（Docker Compose + PostgreSQL + Redis + MinIO）
- [x] 种子数据：60技能/20职业/26武器/4防具/20恐惧症/20躁狂症/10疯狂症状

## 在线访问
- **前端**：http://118.145.110.165
- **后端API**：http://118.145.110.165/api
- **GitHub**：https://github.com/lynn415415/coc.git

## 环境要求
- Node.js 20+
- PostgreSQL 16（Docker 部署已内置）
- Redis 7（Docker 部署已内置）
- Docker & Docker Compose

## 部署步骤（云服务器）

### Docker Compose 部署（推荐）
```bash
cd /opt/coc-platform
docker compose up -d
```

### 环境变量
后端 `.env`：
```
DATABASE_URL=postgresql://coc:coc_password@postgres:5432/coc
REDIS_URL=redis://redis:6379
JWT_SECRET=coc_platform_jwt_secret_key_2026
JWT_REFRESH_SECRET=coc_platform_refresh_secret_key_2026
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=cocminio
MINIO_SECRET_KEY=cocminio_password
```

## API端点
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/refresh | 刷新Token |
| GET | /api/users/me | 获取当前用户 |
| GET | /api/investigators | 角色卡列表 |
| POST | /api/investigators | 创建角色卡 |
| GET | /api/investigators/:id | 角色卡详情 |
| PATCH | /api/investigators/:id | 更新角色卡 |
| POST | /api/investigators/:id/submit | 提交审核 |
| GET | /api/skills | 技能列表 |
| GET | /api/occupations | 职业列表 |
| POST | /api/dice/roll | 基础骰子 |
| POST | /api/dice/attributes | 属性Roll点 |
| POST | /api/dice/check | 技能检定 |
| POST | /api/dice/luck | 幸运检定 |

## 开发计划
- **Phase 2**: 跑团房间/WebSocket/消息系统/检定系统/场景切换
- **Phase 3**: AI辅助/模组解析/NPC对话/地图生成
- **Phase 4**: 战斗轮/装备系统/疯狂与理智/技能成长/复盘
