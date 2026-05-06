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
        occupationId: dto.occupationId ?? null,
        creditRating: this.clamp(dto.creditRating ?? 0, 0, 99),
        cash: this.clamp(dto.cash ?? 0, 0, 999999999),
        assets: dto.assets ?? 0,
        spendingLevel: this.clamp(dto.spendingLevel ?? 0, 0, 999999999),
        livingStandard: dto.livingStandard,
        description: dto.description,
        belief: dto.belief,
        significantPeople: dto.significantPeople,
        meaningfulLocations: dto.meaningfulLocations,
        treasuredPossessions: dto.treasuredPossessions,
        traits: dto.traits,
        injuriesAndScars: dto.injuriesAndScars,
        phobiasAndManias: dto.phobiasAndManias,
        tomesSpellsArtifacts: dto.tomesSpellsArtifacts,
        encountersWithStrange: dto.encountersWithStrange,
        alliesAndOrganizations: dto.alliesAndOrganizations,
        spells: dto.spells,
        notes: dto.notes,
      },
    });

    if (dto.skills && Array.isArray(dto.skills)) {
      const skillData = dto.skills
        .filter((s: any) => s.skillId)
        .map((s: any) => ({
          investigatorId: inv.id,
          skillId: Number(s.skillId),
          customName: s.customName || null,
          initial: this.clamp(s.initial ?? 0, 0, 99),
          growth: this.clamp(s.growth ?? 0, 0, 99),
          occupational: this.clamp(s.occupational ?? 0, 0, 99),
          interest: this.clamp(s.interest ?? 0, 0, 99),
          isOccupational: !!s.isOccupational,
        }));
      if (skillData.length > 0) {
        await this.prisma.investigatorSkill.createMany({ data: skillData });
      }
    }

    await this.saveEquipments(inv.id, dto);

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
        items: {
          include: {
            itemTemplate: true,
            weapon: true,
            armor: true,
          },
        },
        weapons: { include: { weapon: true } },
        armors: { include: { armor: true } },
        vehicles: { include: { vehicle: true } },
        otherAssets: true,
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
      'occupationId', 'creditRating', 'cash', 'assets', 'spendingLevel', 'livingStandard',
      'description', 'belief',
      'significantPeople', 'meaningfulLocations', 'treasuredPossessions',
      'traits', 'injuriesAndScars', 'phobiasAndManias',
      'tomesSpellsArtifacts', 'encountersWithStrange',
      'alliesAndOrganizations', 'spells', 'notes',
      'avatarUrl',
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
    await this.saveEquipments(id, dto);
    return this.calculateDerived(id, ageChanged);
  }

  private async saveEquipments(investigatorId: string, dto: any) {
    if (dto.weapons !== undefined) {
      await this.prisma.investigatorWeapon.deleteMany({ where: { investigatorId } });
      if (Array.isArray(dto.weapons) && dto.weapons.length > 0) {
        await this.prisma.investigatorWeapon.createMany({
          data: dto.weapons.map((w: any) => ({
            investigatorId,
            weaponId: Number(w.weaponId),
            customName: w.customName || null,
            successRate: this.clamp(w.successRate ?? 0, 0, 99),
            currentAmmo: w.currentAmmo !== undefined ? Number(w.currentAmmo) : null,
            isJammed: !!w.isJammed,
            description: w.description || null,
          })),
        });
      }
    }

    if (dto.armors !== undefined) {
      await this.prisma.investigatorArmor.deleteMany({ where: { investigatorId } });
      if (Array.isArray(dto.armors) && dto.armors.length > 0) {
        await this.prisma.investigatorArmor.createMany({
          data: dto.armors.map((a: any) => ({
            investigatorId,
            armorId: Number(a.armorId),
            currentDurability: a.currentDurability !== undefined ? Number(a.currentDurability) : null,
            isEquipped: !!a.isEquipped,
            description: a.description || null,
          })),
        });
      }
    }

    if (dto.vehicles !== undefined) {
      await this.prisma.investigatorVehicle.deleteMany({ where: { investigatorId } });
      if (Array.isArray(dto.vehicles) && dto.vehicles.length > 0) {
        await this.prisma.investigatorVehicle.createMany({
          data: dto.vehicles.map((v: any) => ({
            investigatorId,
            vehicleId: Number(v.vehicleId),
            customName: v.customName || null,
            description: v.description || null,
          })),
        });
      }
    }

    if (dto.otherAssets !== undefined) {
      await this.prisma.investigatorAsset.deleteMany({ where: { investigatorId } });
      if (Array.isArray(dto.otherAssets) && dto.otherAssets.length > 0) {
        await this.prisma.investigatorAsset.createMany({
          data: dto.otherAssets.map((a: any) => ({
            investigatorId,
            category: a.category || 'other',
            name: a.name || '未命名',
            value: this.clamp(a.value ?? 0, 0, 999999999),
            description: a.description || null,
          })),
        });
      }
    }
  }

  async submit(id: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.status !== 'DRAFT') throw new BadRequestException('只有草稿状态可以提交');

    return this.prisma.investigator.update({
      where: { id },
      data: { status: 'APPROVED' },
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

  async remove(id: string, userId: string) {
    const inv = await this.prisma.investigator.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('调查员不存在');
    if (inv.userId !== userId) throw new BadRequestException('只能删除自己的角色卡');

    await this.prisma.investigator.delete({ where: { id } });
    return { success: true };
  }

  private clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }
}
