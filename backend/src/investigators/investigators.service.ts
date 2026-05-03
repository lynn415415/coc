import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestigatorsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const base = {
      str: this.clamp(dto.str ?? 50, 1, 99),
      con: this.clamp(dto.con ?? 50, 1, 99),
      siz: this.clamp(dto.siz ?? 50, 1, 99),
      dex: this.clamp(dto.dex ?? 50, 1, 99),
      app: this.clamp(dto.app ?? 50, 1, 99),
      int: this.clamp(dto.int ?? 50, 1, 99),
      pow: this.clamp(dto.pow ?? 50, 1, 99),
      edu: this.clamp(dto.edu ?? 50, 1, 99),
      luck: this.clamp(dto.luck ?? 50, 1, 99),
    };
    const inv = await this.prisma.investigator.create({
      data: {
        userId,
        name: dto.name || '未命名调查员',
        era: dto.era || 'MODERN',
        age: this.clamp(dto.age ?? 25, 15, 99),
        gender: dto.gender,
        residence: dto.residence,
        birthplace: dto.birthplace,
        ...base,
        baseStr: base.str,
        baseCon: base.con,
        baseSiz: base.siz,
        baseDex: base.dex,
        baseApp: base.app,
        baseInt: base.int,
        basePow: base.pow,
        baseEdu: base.edu,
        baseLuck: base.luck,
      },
    });
    return this.calculateDerived(inv.id);
  }

  async list(userId: string, status?: string) {
    return this.prisma.investigator.findMany({
      where: { userId, ...(status ? { status: status as any } : {}) },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, era: true, age: true, occupationId: true,
        status: true, hp: true, maxHp: true, san: true, maxSan: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  async getById(id: string) {
    const inv = await this.prisma.investigator.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
        occupation: true,
        items: true,
      },
    });
    if (!inv) throw new NotFoundException('调查员不存在');
    return inv;
  }

  async update(id: string, dto: any) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.status === 'APPROVED') {
      const allowed = ['avatarUrl', 'items', 'description'];
      const hasForbidden = Object.keys(dto).some((k) => !allowed.includes(k));
      if (hasForbidden) throw new BadRequestException('已通过审核的角色卡不能修改属性');
    }

    const data: any = {};
    const fields = [
      'name', 'era', 'age', 'gender', 'residence', 'birthplace',
      'occupationId', 'creditRating', 'description', 'belief',
      'significantPeople', 'meaningfulLocations', 'treasuredPossessions',
      'traits', 'injuriesAndScars', 'phobiasAndManias',
      'tomesSpellsArtifacts', 'encountersWithStrange',
    ];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    // 如果传了基础属性，同时更新 baseXxx
    const attrFields = ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu', 'luck'];
    attrFields.forEach((f) => {
      if (dto[f] !== undefined) {
        const v = this.clamp(dto[f], 1, 99);
        data[f] = v;
        data[`base${f.charAt(0).toUpperCase()}${f.slice(1)}`] = v;
      }
    });

    // 如果修改了年龄，需要重新计算年龄补正
    const ageChanged = dto.age !== undefined && dto.age !== inv.age;

    await this.prisma.investigator.update({ where: { id }, data });
    return this.calculateDerived(id, ageChanged);
  }

  async submit(id: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.status !== 'DRAFT') throw new BadRequestException('只有草稿状态可以提交');

    return this.prisma.investigator.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  async calculateDerived(id: string, forceRecalc = false) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');

    const age = this.clamp(inv.age, 15, 99);

    // 取原始值进行年龄补正计算
    const baseStr = inv.baseStr ?? inv.str ?? 50;
    const baseCon = inv.baseCon ?? inv.con ?? 50;
    const baseSiz = inv.baseSiz ?? inv.siz ?? 50;
    const baseDex = inv.baseDex ?? inv.dex ?? 50;
    const baseApp = inv.baseApp ?? inv.app ?? 50;
    const baseInt = inv.baseInt ?? inv.int ?? 50;
    const basePow = inv.basePow ?? inv.pow ?? 50;
    const baseEdu = inv.baseEdu ?? inv.edu ?? 50;
    const baseLuck = inv.baseLuck ?? inv.luck ?? 50;

    // COC七版年龄补正
    let str = baseStr;
    let con = baseCon;
    let siz = baseSiz;
    let dex = baseDex;
    let app = baseApp;
    let edu = baseEdu;
    let eduImprovementRolls = 0;

    if (age >= 15 && age <= 19) {
      str = Math.max(1, baseStr - 5);
      siz = Math.max(1, baseSiz - 5);
      edu = Math.max(1, baseEdu - 5);
      eduImprovementRolls = 1;
    } else if (age >= 20 && age <= 39) {
      eduImprovementRolls = 1;
    } else if (age >= 40 && age <= 49) {
      str = Math.max(1, baseStr - 5);
      con = Math.max(1, baseCon - 5);
      dex = Math.max(1, baseDex - 5);
      app = Math.max(1, baseApp - 5);
      eduImprovementRolls = 2;
    } else if (age >= 50 && age <= 59) {
      str = Math.max(1, baseStr - 10);
      con = Math.max(1, baseCon - 10);
      dex = Math.max(1, baseDex - 10);
      app = Math.max(1, baseApp - 10);
      eduImprovementRolls = 3;
    } else if (age >= 60 && age <= 69) {
      str = Math.max(1, baseStr - 20);
      con = Math.max(1, baseCon - 20);
      dex = Math.max(1, baseDex - 20);
      app = Math.max(1, baseApp - 15);
      eduImprovementRolls = 4;
    } else if (age >= 70 && age <= 79) {
      str = Math.max(1, baseStr - 40);
      con = Math.max(1, baseCon - 40);
      dex = Math.max(1, baseDex - 40);
      app = Math.max(1, baseApp - 20);
      eduImprovementRolls = 4;
    } else if (age >= 80) {
      str = Math.max(1, baseStr - 80);
      con = Math.max(1, baseCon - 80);
      dex = Math.max(1, baseDex - 80);
      app = Math.max(1, baseApp - 25);
      eduImprovementRolls = 4;
    }

    // 计算衍生属性
    const maxHp = Math.floor((con + siz) / 10);
    const maxSan = basePow;
    const maxMp = Math.floor(basePow / 5);
    const majorWoundValue = Math.ceil(maxHp / 2);

    let mov = 8;
    if (str >= siz && dex >= siz) mov = 9;
    else if (str < siz && dex < siz) mov = 7;
    if (age >= 80) mov -= 2;
    else if (age >= 40) mov -= 1;

    const strSiz = str + siz;
    let db = '0';
    let build = 0;
    if (strSiz <= 64) { db = '-2'; build = -2; }
    else if (strSiz <= 84) { db = '-1'; build = -1; }
    else if (strSiz <= 124) { db = '0'; build = 0; }
    else if (strSiz <= 164) { db = '+1d4'; build = 1; }
    else if (strSiz <= 204) { db = '+1d6'; build = 2; }
    else { db = '+2d6'; build = 3; }

    const updated = await this.prisma.investigator.update({
      where: { id },
      data: {
        str, con, siz, dex, app, int: baseInt, pow: basePow, edu, luck: baseLuck,
        maxHp, hp: maxHp, maxSan, san: maxSan, maxMp, mp: maxMp,
        mov, db, build, damageBonus: db, majorWoundValue,
        eduImprovementRolls,
      },
      include: {
        skills: { include: { skill: true } },
        occupation: true,
      },
    });

    return updated;
  }

  private clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }
}
