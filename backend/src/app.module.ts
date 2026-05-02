import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvestigatorsModule } from './investigators/investigators.module';
import { SkillsModule } from './skills/skills.module';
import { OccupationsModule } from './occupations/occupations.module';
import { DiceModule } from './dice/dice.module';

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
  ],
})
export class AppModule {}
