import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvestigatorsModule } from './investigators/investigators.module';
import { SkillsModule } from './skills/skills.module';
import { OccupationsModule } from './occupations/occupations.module';
import { DiceModule } from './dice/dice.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ScenesModule } from './scenes/scenes.module';
import { MessagesModule } from './messages/messages.module';
import { ChecksModule } from './checks/checks.module';
import { QuickPanelModule } from './quick-panel/quick-panel.module';
import { ActionsModule } from './actions/actions.module';
import { ItemsModule } from './items/items.module';
import { WeaponsModule } from './weapons/weapons.module';
import { ArmorsModule } from './armors/armors.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AssetReferencesModule } from './asset-references/asset-references.module';
import { AiModule } from './ai/ai.module';
import { CombatModule } from './combat/combat.module';
import { CluesModule } from './clues/clues.module';
import { SceneTokenModule } from './scene-token/scene-token.module';
import { EntityRelationsModule } from './entity-relations/entity-relations.module';
import { UploadModule } from './upload/upload.module';
import { InviteCodesModule } from './invite-codes/invite-codes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: async () => {
        const host = process.env.REDIS_HOST;
        const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 0;
        if (host && port) {
          return { redis: { host, port } };
        }
        // Fallback: use redis-memory-server for local dev
        const { RedisMemoryServer } = await import('redis-memory-server');
        const redisServer = new RedisMemoryServer();
        const memHost = await redisServer.getHost();
        const memPort = await redisServer.getPort();
        console.log(`[BullModule] Using redis-memory-server at ${memHost}:${memPort}`);
        return { redis: { host: memHost, port: memPort } };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    InvestigatorsModule,
    SkillsModule,
    OccupationsModule,
    DiceModule,
    CampaignsModule,
    ScenesModule,
    MessagesModule,
    ChecksModule,
    QuickPanelModule,
    ActionsModule,
    ItemsModule,
    WeaponsModule,
    ArmorsModule,
    VehiclesModule,
    AssetReferencesModule,
    AiModule,
    CombatModule,
    CluesModule,
    SceneTokenModule,
    EntityRelationsModule,
    UploadModule,
    InviteCodesModule,
  ],
})
export class AppModule {}
