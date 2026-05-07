import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: { userId: string }, @Body() data: any) {
    return this.usersService.update(user.userId, data);
  }

  @Get('kp-list')
  async getKpList() {
    return this.usersService.getKpUsers();
  }

  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
  ) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'ADMIN') throw new ForbiddenException('仅管理员可访问');
    return this.usersService.findAll(parseInt(page || '1'), parseInt(limit || '20'), role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  async updateRole(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'ADMIN') throw new ForbiddenException('仅管理员可修改角色');
    return this.usersService.updateRole(id, role);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    const me = await this.usersService.findById(user.userId);
    if (me?.role !== 'ADMIN') throw new ForbiddenException('仅管理员可删除用户');
    return this.usersService.remove(id);
  }
}
