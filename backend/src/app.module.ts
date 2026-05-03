import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
