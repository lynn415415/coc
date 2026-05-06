import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignGateway } from './campaign.gateway';
import { DiceService } from '../dice/dice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { CombatModule } from '../combat/combat.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    CombatModule,
    BullModule.registerQueue({ name: 'ai-generation' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignGateway, DiceService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
