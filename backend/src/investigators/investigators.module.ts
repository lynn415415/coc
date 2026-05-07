import { Module } from '@nestjs/common';
import { InvestigatorsController } from './investigators.controller';
import { InvestigatorsService } from './investigators.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UploadModule, UsersModule],
  controllers: [InvestigatorsController],
  providers: [InvestigatorsService],
  exports: [InvestigatorsService],
})
export class InvestigatorsModule {}
