import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = process.env['DATABASE_URL'] || 'file:./prisma/dev.db';
    if (dbUrl.startsWith('file:')) {
      // Local SQLite: use libsql adapter
      const { PrismaLibSql } = require('@prisma/adapter-libsql');
      const adapter = new PrismaLibSql({ url: dbUrl });
      super({ adapter });
    } else {
      // PostgreSQL or other: use default PrismaClient (reads DATABASE_URL from env)
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
