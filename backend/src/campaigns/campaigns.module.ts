import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignGateway } from './campaign.gateway';
import { DiceService } from '../dice/dice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignGateway, DiceService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
