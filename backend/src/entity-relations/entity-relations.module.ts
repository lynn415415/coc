import { Module } from '@nestjs/common';
import { EntityRelationsService } from './entity-relations.service';
import { EntityRelationsController } from './entity-relations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EntityRelationsService],
  controllers: [EntityRelationsController],
  exports: [EntityRelationsService],
})
export class EntityRelationsModule {}
