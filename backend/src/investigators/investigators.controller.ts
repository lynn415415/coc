import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvestigatorsService } from './investigators.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';
import { UsersService } from '../users/users.service';

@Controller('investigators')
@UseGuards(JwtAuthGuard)
export class InvestigatorsController {
  constructor(
    private readonly service: InvestigatorsService,
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@CurrentUser() user: { userId: string }, @Body() dto: any) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }, @Query('status') status?: string) {
    return this.service.list(user.userId, status);
  }

  @Get('review-queue')
  async reviewQueue(@CurrentUser() user: { userId: string }) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'KP' && me?.role !== 'ADMIN') throw new ForbiddenException('仅KP和管理员可查看审核队列');
    return this.service.getReviewQueue(user.userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body('reviewerId') reviewerId?: string) {
    return this.service.submit(id, reviewerId);
  }

  @Post(':id/approve')
  async approve(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'KP' && me?.role !== 'ADMIN') throw new ForbiddenException('仅KP和管理员可审核');
    return this.service.approve(id, user.userId);
  }

  @Post(':id/reject')
  async reject(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body('note') note?: string) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'KP' && me?.role !== 'ADMIN') throw new ForbiddenException('仅KP和管理员可驳回');
    return this.service.reject(id, user.userId, note || '');
  }

  @Post(':id/calculate')
  async calculate(@Param('id') id: string) {
    return this.service.calculateDerived(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('请选择图片文件');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG/PNG/WebP/GIF 格式');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }
    // Delete old avatar if exists
    const old = await this.service.getById(id);
    if (old?.avatarUrl) {
      const key = old.avatarUrl.split('/').slice(-2).join('/');
      await this.uploadService.deleteFile(key).catch(() => {});
    }
    const { url } = await this.uploadService.uploadFile(file, 'avatars');
    await this.service.update(id, { avatarUrl: url });
    return { url };
  }

  @Delete(':id/avatar')
  async deleteAvatar(@Param('id') id: string) {
    const old = await this.service.getById(id);
    if (old?.avatarUrl) {
      const key = old.avatarUrl.split('/').slice(-2).join('/');
      await this.uploadService.deleteFile(key).catch(() => {});
      await this.service.update(id, { avatarUrl: null });
    }
    return { success: true };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.remove(id, user.userId);
  }
}
