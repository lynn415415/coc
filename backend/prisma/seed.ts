import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaLibSql({
  url: process.env['DATABASE_URL'] || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 技能
  const skills = [
    { name: '会计', baseValue: 5 },
    { name: '法律', baseValue: 5 },
    { name: '人类学', baseValue: 1 },
    { name: '图书馆使用', baseValue: 20 },
    { name: '估价', baseValue: 5 },
    { name: '聆听', baseValue: 20 },
    { name: '考古学', baseValue: 1 },
    { name: '锁匠', baseValue: 1 },
    { name: '机械维修', baseValue: 10 },
    { name: '医学', baseValue: 1 },
    { name: '博物学', baseValue: 10 },
    { name: '取悦', baseValue: 15 },
    { name: '导航', baseValue: 10 },
    { name: '攀爬', baseValue: 20 },
    { name: '神秘学', baseValue: 5 },
    { name: '计算机使用', baseValue: 5 },
    { name: '操作重型机械', baseValue: 1 },
    { name: '信用评级', baseValue: 0 },
    { name: '说服', baseValue: 10 },
    { name: '克苏鲁神话', baseValue: 0 },
    { name: '乔装', baseValue: 5 },
    { name: '精神分析', baseValue: 1 },
    { name: '心理学', baseValue: 10 },
    { name: '汽车驾驶', baseValue: 20 },
    { name: '骑术', baseValue: 5 },
    { name: '电气维修', baseValue: 10 },
    { name: '电子学', baseValue: 1 },
    { name: '话术', baseValue: 5 },
    { name: '妙手', baseValue: 10 },
    { name: '侦查', baseValue: 25 },
    { name: '潜行', baseValue: 20 },
    { name: '游泳', baseValue: 20 },
    { name: '投掷', baseValue: 20 },
    { name: '追踪', baseValue: 10 },
    { name: '驯兽', baseValue: 5 },
    { name: '急救', baseValue: 30 },
    { name: '潜水', baseValue: 1 },
    { name: '历史', baseValue: 5 },
    { name: '爆破', baseValue: 1 },
    { name: '恐吓', baseValue: 15 },
    { name: '读唇', baseValue: 1 },
    { name: '跳跃', baseValue: 20 },
    { name: '催眠', baseValue: 1 },
    { name: '炮术', baseValue: 1 },
    { name: '母语', baseValue: 0 },
    { name: '闪避', baseValue: 0, category: '战斗' },
    { name: '格斗(斗殴)', baseValue: 25, category: '战斗' },
    { name: '格斗(鞭子)', baseValue: 5, category: '战斗' },
    { name: '格斗(电锯)', baseValue: 10, category: '战斗' },
    { name: '格斗(斧)', baseValue: 15, category: '战斗' },
    { name: '格斗(剑)', baseValue: 20, category: '战斗' },
    { name: '格斗(绞具)', baseValue: 15, category: '战斗' },
    { name: '格斗(链枷)', baseValue: 10, category: '战斗' },
    { name: '格斗(矛)', baseValue: 20, category: '战斗' },
    { name: '射击(手枪)', baseValue: 20, category: '战斗' },
    { name: '射击(步枪/霰弹枪)', baseValue: 25, category: '战斗' },
    { name: '射击(冲锋枪)', baseValue: 15, category: '战斗' },
    { name: '射击(弓术)', baseValue: 15, category: '战斗' },
    { name: '射击(机枪)', baseValue: 10, category: '战斗' },
    { name: '射击(重武器)', baseValue: 10, category: '战斗' },
  ];

  for (const s of skills) {
    await prisma.skill.upsert({
      where: { id: skills.indexOf(s) + 1 },
      update: {},
      create: s,
    });
  }
  console.log(`Inserted ${skills.length} skills`);

  // 职业
  const occupations = [
    { name: '会计师', creditMin: 30, creditMax: 70, pointFormula: 'EDU*4', skillIds: '[1,2,4,6,19,30,0,0]' },
    { name: '杂技演员', creditMin: 9, creditMax: 20, pointFormula: 'EDU*2+DEX*2', skillIds: '[14,22,42,33,30,32,0,0]' },
    { name: '演员', creditMin: 9, creditMax: 40, pointFormula: 'EDU*2+APP*2', skillIds: '[21,40,23,23,25,0,0,0]' },
    { name: '古董商', creditMin: 30, creditMax: 50, pointFormula: 'EDU*4', skillIds: '[1,5,24,16,0,0,0,0]' },
    { name: '考古学家', creditMin: 10, creditMax: 40, pointFormula: 'EDU*4', skillIds: '[5,7,38,0,0,0,0,0]' },
    { name: '艺术家', creditMin: 9, creditMax: 50, pointFormula: 'EDU*2+MAX(DEX*2,POW*2)', skillIds: '[0,0,0,0,0,0,0,0]' },
    { name: '运动员', creditMin: 9, creditMax: 70, pointFormula: 'EDU*2+MAX(STR*2,DEX*2)', skillIds: '[14,42,47,0,0,0,0,0]' },
    { name: '作家', creditMin: 9, creditMax: 30, pointFormula: 'EDU*4', skillIds: '[0,0,0,0,0,0,0,0]' },
    { name: '酒保', creditMin: 8, creditMax: 25, pointFormula: 'EDU*2+APP*2', skillIds: '[1,12,13,6,25,30,0,0]' },
    { name: '猎人', creditMin: 20, creditMax: 50, pointFormula: 'EDU*2+MAX(STR*2,DEX*2)', skillIds: '[55,6,11,13,37,32,0,0]' },
    { name: '书商', creditMin: 20, creditMax: 40, pointFormula: 'EDU*4', skillIds: '[1,5,24,38,4,46,19,0]' },
    { name: '神职人员', creditMin: 9, creditMax: 60, pointFormula: 'EDU*4', skillIds: '[1,38,4,6,0,0,0,0]' },
    { name: '程序员', creditMin: 10, creditMax: 70, pointFormula: 'EDU*4', skillIds: '[16,27,4,0,0,0,0,0]' },
    { name: '牛仔', creditMin: 9, creditMax: 20, pointFormula: 'EDU*2+MAX(STR*2,DEX*2)', skillIds: '[22,0,0,0,0,0,0,0]' },
    { name: '工匠', creditMin: 10, creditMax: 40, pointFormula: 'EDU*2+DEX*2', skillIds: '[1,0,0,0,0,0,0,0]' },
    { name: '罪犯', creditMin: 5, creditMax: 75, pointFormula: 'EDU*2+MAX(STR*2,DEX*2)', skillIds: '[21,16,0,0,0,0,0,0]' },
    { name: '医生', creditMin: 30, creditMax: 80, pointFormula: 'EDU*4', skillIds: '[10,0,0,0,0,0,0,0]' },
    { name: '警察', creditMin: 9, creditMax: 60, pointFormula: 'EDU*2+MAX(STR*2,DEX*2)', skillIds: '[12,13,19,6,25,30,34,0]' },
    { name: '教授', creditMin: 20, creditMax: 70, pointFormula: 'EDU*4', skillIds: '[38,4,46,0,0,0,0,0]' },
    { name: '科学家', creditMin: 9, creditMax: 70, pointFormula: 'EDU*4', skillIds: '[0,0,0,0,0,0,0,0]' },
  ];

  for (const o of occupations) {
    await prisma.occupation.upsert({
      where: { id: occupations.indexOf(o) + 1 },
      update: {},
      create: { ...o, description: '' },
    });
  }
  console.log(`Inserted ${occupations.length} occupations`);

  // 武器
  const weapons = [
    { name: '弓箭', damageFormula: '1D6+半DB', baseRange: '30码', impale: true, attacksPerRound: '1', ammoCapacity: 1, malfunction: 97 },
    { name: '黄铜指虎', damageFormula: '1D3+1+DB', baseRange: '接触', impale: false, attacksPerRound: '1' },
    { name: '长鞭', damageFormula: '1D3+半DB', baseRange: '10英尺', impale: false, attacksPerRound: '1' },
    { name: '电锯', damageFormula: '2D8', baseRange: '接触', impale: true, attacksPerRound: '1', malfunction: 95 },
    { name: '甩棍', damageFormula: '1D8+DB', baseRange: '接触', impale: false, attacksPerRound: '1' },
    { name: '棒球棍', damageFormula: '1D8+DB', baseRange: '接触', impale: false, attacksPerRound: '1' },
    { name: '警棍', damageFormula: '1D6+DB', baseRange: '接触', impale: false, attacksPerRound: '1' },
    { name: '弩', damageFormula: '1D8+2', baseRange: '50码', impale: true, attacksPerRound: '1/2', ammoCapacity: 1, malfunction: 96 },
    { name: '手斧', damageFormula: '1D6+1+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '大型刀具', damageFormula: '1D8+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '中型刀具', damageFormula: '1D4+2+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '小型刀具', damageFormula: '1D4+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '双节棍', damageFormula: '1D8+DB', baseRange: '接触', impale: false, attacksPerRound: '1' },
    { name: '投石', damageFormula: '1D4+半DB', baseRange: 'STR/5码', impale: false, attacksPerRound: '1' },
    { name: '手里剑', damageFormula: '1D3+半DB', baseRange: 'STR/5码', impale: true, attacksPerRound: '2' },
    { name: '矛', damageFormula: '1D8+1', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '投矛', damageFormula: '1D8+半DB', baseRange: 'STR/5码', impale: true, attacksPerRound: '1' },
    { name: '大型剑', damageFormula: '1D8+1+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '中型剑', damageFormula: '1D6+1+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '轻型剑', damageFormula: '1D6+DB', baseRange: '接触', impale: true, attacksPerRound: '1' },
    { name: '手枪', damageFormula: '1D10', baseRange: '15码', impale: true, attacksPerRound: '1(3)', ammoCapacity: 8, malfunction: 100 },
    { name: '左轮手枪', damageFormula: '1D10', baseRange: '15码', impale: true, attacksPerRound: '1(3)', ammoCapacity: 6, malfunction: 100 },
    { name: '步枪/霰弹枪', damageFormula: '4D6', baseRange: '100码', impale: true, attacksPerRound: '1', ammoCapacity: 5, malfunction: 100 },
    { name: '冲锋枪', damageFormula: '1D10', baseRange: '30码', impale: true, attacksPerRound: '1(2)', ammoCapacity: 30, malfunction: 96 },
    { name: '机枪', damageFormula: '2D10+6', baseRange: '200码', impale: true, attacksPerRound: '1', ammoCapacity: 100, malfunction: 96 },
    { name: '重武器', damageFormula: '4D10', baseRange: '100码', impale: true, attacksPerRound: '1', malfunction: 95 },
  ];

  for (const w of weapons) {
    await prisma.weapon.upsert({
      where: { id: weapons.indexOf(w) + 1 },
      update: {},
      create: w,
    });
  }
  console.log(`Inserted ${weapons.length} weapons`);

  // 防具
  const armors = [
    { name: '厚重皮夹克', armorValue: 1, movPenalty: 0, coverage: '躯干', applicableTo: '人类、人型生物' },
    { name: '一战标准钢盔', armorValue: 2, movPenalty: 0, coverage: '头部', applicableTo: '人类、有明显头颅的生物' },
    { name: '现代美军头盔', armorValue: 5, movPenalty: 0, coverage: '头部', applicableTo: '人类、有明显头颅的生物' },
    { name: '重型凯芙拉防弹背心', armorValue: 8, movPenalty: 0, coverage: '躯干', applicableTo: '人类、人型生物' },
  ];

  for (const a of armors) {
    await prisma.armor.upsert({
      where: { id: armors.indexOf(a) + 1 },
      update: {},
      create: a,
    });
  }
  console.log(`Inserted ${armors.length} armors`);

  // 恐惧症
  const phobiaData = [
    '洗澡恐惧症（Ablutophobia）：对于洗涤或洗澡的恐惧。',
    '恐高症（Acrophobia）：对于身处高处的恐惧。',
    '飞行恐惧症（Aerophobia）：对飞行的恐惧。',
    '广场恐惧症（Agoraphobia）：对于开放的（拥挤）公共场所的恐惧。',
    '恐鸡症（Alektorophobia）：对鸡的恐惧。',
    '大蒜恐惧症（Alliumphobia）：对大蒜的恐惧。',
    '乘车恐惧症（Amaxophobia）：对于乘坐地面载具的恐惧。',
    '恐风症（Ancraophobia）：对风的恐惧。',
    '男性恐惧症（Androphobia）：对于成年男性的恐惧。',
    '恐英症（Anglophobia）：对英格兰或英格兰文化的恐惧。',
    '恐花症（Anthophobia）：对花的恐惧。',
    '截肢者恐惧症（Apotemnophobia）：对截肢者的恐惧。',
    '蜘蛛恐惧症（Arachnophobia）：对蜘蛛的恐惧。',
    '闪电恐惧症（Astraphobia）：对闪电的恐惧。',
    '废墟恐惧症（Atephobia）：对遗迹或残址的恐惧。',
    '长笛恐惧症（Aulophobia）：对长笛的恐惧。',
    '细菌恐惧症（Bacteriophobia）：对细菌的恐惧。',
    '导弹/子弹恐惧症（Ballistophobia）：对导弹或子弹的恐惧。',
    '跌落恐惧症（Basophobia）：对于跌倒或摔落的恐惧。',
    '书籍恐惧症（Bibliophobia）：对书籍的恐惧。',
  ];

  for (let i = 0; i < phobiaData.length; i++) {
    await prisma.phobia.upsert({
      where: { id: i + 1 },
      update: {},
      create: { rollMin: i + 1, rollMax: i + 1, name: phobiaData[i] },
    });
  }
  console.log(`Inserted ${phobiaData.length} phobias`);

  // 躁狂症
  const maniaData = [
    '沐浴癖（Ablutomania）：执着于清洗自己。',
    '畸形癖（Acromania）：执着于高处。',
    '滑行癖（Agromania）：执着于独处。',
    '疼痛癖（Algomania）：执着于疼痛。',
    '学识癖（Almanachmania）：执着于学识。',
    '健康癖（Amenomania）：执着于健康。',
    '锚癖（Anchormania）：执着于锚。',
    '药物癖（Andromania）：执着于药物。',
    '愤怒癖（Anglomania）：执着于愤怒。',
    '花朵癖（Anthomania）：执着于花朵。',
    '打赌癖（Astromania）：执着于打赌。',
    '天文学癖（Astromania）：执着于天文学。',
    '书籍癖（Bibliomania）：执着于书籍。',
    '癫痫癖（Epilepsia）：执着于癫痫。',
    '夸大癖（Grandimania）：执着于夸大。',
    '偷窃癖（Kleptomania）：执着于偷窃。',
    '纵火癖（Pyromania）：执着于纵火。',
    '提问癖（Questionmania）：执着于提问。',
    '铁路癖（Siderodromomania）：执着于铁路。',
    '铁路旅行癖（Siderodromomania）：执着于铁路旅行。',
  ];

  for (let i = 0; i < maniaData.length; i++) {
    await prisma.mania.upsert({
      where: { id: i + 1 },
      update: {},
      create: { rollMin: i + 1, rollMax: i + 1, name: maniaData[i] },
    });
  }
  console.log(`Inserted ${maniaData.length} manias`);

  // 疯狂症状
  const episodes = [
    { episodeType: 'immediate', rollValue: 1, name: '失忆', description: '调查员会发现自己只记得最后身处的安全地点，却没有任何来到这里的记忆。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 2, name: '假性残疾', description: '调查员陷入了心理性的失明，失聪以及躯体缺失感中。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 3, name: '暴力倾向', description: '调查员陷入了六亲不认的暴力行为中，对周围的敌人与友方进行着无差别的攻击。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 4, name: '偏执', description: '调查员陷入了严重的偏执妄想之中。有人在暗中窥视着他们，同伴中有人背叛了他们。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 5, name: '人际依赖', description: '调查员将他人误认为了他重要的人并且努力与那个人保持那种关系。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 6, name: '昏厥', description: '调查员当场昏倒。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 7, name: '逃避行为', description: '调查员会用任何的手段试图逃离现在所处的位置。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 8, name: '竭嘶底里', description: '调查员表现出大笑，哭泣，嘶吼，害怕等的极端情绪表现。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 9, name: '恐惧', description: '调查员从恐惧症状表中选择一个恐惧源。', duration: '1D10轮' },
    { episodeType: 'immediate', rollValue: 10, name: '躁狂', description: '调查员从躁狂症状表中选择一个躁狂的诱因。', duration: '1D10轮' },
  ];

  for (const e of episodes) {
    await prisma.insanityEpisode.upsert({
      where: { id: episodes.indexOf(e) + 1 },
      update: {},
      create: e,
    });
  }
  console.log(`Inserted ${episodes.length} insanity episodes`);

  console.log('Seed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
