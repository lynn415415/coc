import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCampaignDto, UpdateCampaignDto, BindInvestigatorDto } from './dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateCampaignDto) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }) {
    return this.service.list(user.userId);
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
    return this.service.update(id, user.userId, dto);
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
    return this.service.approveMember(campaignId, user.userId, user.userId, targetUserId);
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

  @Post(':id/start')
  async start(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.start(id, user.userId);
  }

  @Post(':id/end')
  async end(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.end(id, user.userId);
  }
}
