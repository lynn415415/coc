import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestigatorsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const inv = await this.prisma.investigator.create({
      data: {
        userId,
        name: dto.name || '未命名调查员',
        era: dto.era || 'MODERN',
        age: dto.age ?? 25,
        gender: dto.gender,
        residence: dto.residence,
        birthplace: dto.birthplace,
        str: dto.str ?? 50,
        con: dto.con ?? 50,
        siz: dto.siz ?? 50,
        dex: dto.dex ?? 50,
        app: dto.app ?? 50,
        int: dto.int ?? 50,
        pow: dto.pow ?? 50,
        edu: dto.edu ?? 50,
        luck: dto.luck ?? 50,
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
      'str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu', 'luck',
      'occupationId', 'creditRating', 'description', 'belief',
      'significantPeople', 'meaningfulLocations', 'treasuredPossessions',
      'traits', 'injuriesAndScars', 'phobiasAndManias',
      'tomesSpellsArtifacts', 'encountersWithStrange',
    ];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });

    await this.prisma.investigator.update({ where: { id }, data });
    return this.calculateDerived(id);
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

  async calculateDerived(id: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');

    const str = inv.str, con = inv.con, siz = inv.siz;
    const dex = inv.dex, pow = inv.pow, int = inv.int, edu = inv.edu;
    const age = inv.age;

    const maxHp = Math.floor((con + siz) / 10);
    const maxSan = pow;
    const maxMp = Math.floor(pow / 5);
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

    let ageAdjustmentApplied = inv.ageAdjustmentApplied;
    let eduImprovementRolls = inv.eduImprovementRolls;

    if (!ageAdjustmentApplied && age) {
      if (age >= 15 && age <= 19) {
        eduImprovementRolls = 1;
      } else if (age >= 20 && age <= 39) {
        eduImprovementRolls = 1;
      } else if (age >= 40 && age <= 49) {
        eduImprovementRolls = 2;
      } else if (age >= 50 && age <= 59) {
        eduImprovementRolls = 3;
      } else if (age >= 60 && age <= 69) {
        eduImprovementRolls = 4;
      } else if (age >= 70 && age <= 79) {
        eduImprovementRolls = 4;
      } else if (age >= 80) {
        eduImprovementRolls = 4;
      }
      ageAdjustmentApplied = true;
    }

    const updated = await this.prisma.investigator.update({
      where: { id },
      data: {
        maxHp, hp: maxHp, maxSan, san: maxSan, maxMp, mp: maxMp,
        mov, db, build, damageBonus: db, majorWoundValue,
        ageAdjustmentApplied, eduImprovementRolls,
      },
      include: {
        skills: { include: { skill: true } },
        occupation: true,
      },
    });

    return updated;
  }
}
