import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCampaignDto, UpdateCampaignDto, BindInvestigatorDto } from './dto';
import { AiService } from '../ai/ai.service';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(
    private readonly service: CampaignsService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateCampaignDto) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }) {
    return this.service.list(user.userId);
  }

  @Get('discover')
  async discover(@CurrentUser() user: { userId: string }) {
    return this.service.discover(user.userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const result = await this.service.update(id, user.userId, dto);
    this.aiService.invalidateCache(id);
    return result;
  }

  @Post(':id/join')
  async join(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.join(id, user.userId);
  }

  @Post(':id/members/:userId/approve')
  async approveMember(
    @CurrentUser() user: { userId: string },
    @Param('id') campaignId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.service.approveMember(campaignId, user.userId, targetUserId);
  }

  @Post(':id/members/:userId/kick')
  async kickMember(
    @CurrentUser() user: { userId: string },
    @Param('id') campaignId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.service.kickMember(campaignId, user.userId, targetUserId);
  }

  @Post(':id/bind-investigator')
  async bindInvestigator(
    @CurrentUser() user: { userId: string },
    @Param('id') campaignId: string,
    @Body() dto: BindInvestigatorDto,
  ) {
    return this.service.bindInvestigator(campaignId, user.userId, dto.investigatorId);
  }

  @Post(':id/unbind-investigator')
  async unbindInvestigator(
    @CurrentUser() user: { userId: string },
    @Param('id') campaignId: string,
  ) {
    return this.service.unbindInvestigator(campaignId, user.userId);
  }

  @Post(':id/start')
  async start(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.start(id, user.userId);
  }

  @Post(':id/end')
  async end(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.end(id, user.userId);
  }

  @Get(':id/export')
  async exportCampaign(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.exportCampaign(id, user.userId);
  }
}
