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
      // PostgreSQL: use pg adapter
      const { PrismaPg } = require('@prisma/adapter-pg');
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: dbUrl });
      const adapter = new PrismaPg(pool);
      super({ adapter });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
