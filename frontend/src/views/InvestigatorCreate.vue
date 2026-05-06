<template>
  <div class="page">
    <div class="back-bar">
      <n-button text @click="router.push('/investigators')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回角色卡列表
      </n-button>
    </div>

    <h2>{{ isEdit ? '编辑调查员' : '创建调查员' }}</h2>

    <n-steps :current="step + 1" class="steps">
      <n-step title="基础信息" />
      <n-step title="Roll属性" />
      <n-step title="职业与技能" />
      <n-step title="背景" />
      <n-step title="装备与资产" />
    </n-steps>

    <!-- Step 1: 基础信息 -->
    <div v-if="step === 0" class="step-content">
      <n-form :model="form" label-placement="left" label-width="100">
        <n-form-item label="姓名" required>
          <n-input v-model:value="form.name" placeholder="调查员姓名" />
        </n-form-item>
        <n-form-item label="时代">
          <n-select v-model:value="form.era" :options="eraOptions" />
        </n-form-item>
        <n-form-item label="年龄">
          <n-input-number v-model:value="form.age" :min="15" :max="99" />
        </n-form-item>
        <n-form-item label="性别">
          <n-select v-model:value="form.gender" :options="[{label:'男',value:'男'},{label:'女',value:'女'}]" />
        </n-form-item>
        <n-form-item label="住地">
          <n-input v-model:value="form.residence" placeholder="现居地" />
        </n-form-item>
        <n-form-item label="故乡">
          <n-input v-model:value="form.birthplace" placeholder="出生地" />
        </n-form-item>
      </n-form>
    </div>

    <!-- Step 2: Roll属性 -->
    <div v-if="step === 1" class="step-content">
      <div class="mode-switch">
        <n-radio-group v-model:value="rollMethod">
          <n-radio-button value="dice">掷骰生成</n-radio-button>
          <n-radio-button value="point_buy">购点法</n-radio-button>
        </n-radio-group>
      </div>

      <div v-if="form.age" class="age-adjustment-hint">
        <p class="age-title">当前年龄 {{ form.age }} 岁的补正规则：</p>
        <p>{{ ageAdjustmentText }}</p>
      </div>

      <!-- 掷骰模式 -->
      <div v-if="rollMethod === 'dice'">
        <div class="step-hint">
          <p>掷骰生成 5 组属性，选择最满意的一组。<strong>掷骰后不可重Roll</strong>。</p>
          <p>幸运值随属性组一起掷出。保存时系统会根据<strong>年龄</strong>自动应用年龄补正。</p>
        </div>

        <div class="roll-section">
          <n-button type="primary" @click="rollAttributes" :loading="rolling" :disabled="rolledSets.length > 0">
            {{ rolledSets.length > 0 ? '已生成（不可重Roll）' : '掷骰生成属性组' }}
          </n-button>
        </div>

        <div v-if="rolledSets.length > 0" class="sets">
          <p class="sets-title">选择一组属性（点击圆圈选中）：</p>
          <n-radio-group v-model:value="selectedSetIndex">
            <n-space vertical>
              <n-radio v-for="(set, idx) in rolledSets" :key="idx" :value="idx">
                <div class="set-row">
                  <span v-for="key in attrKeys" :key="key">{{ attrMap[key] }} {{ set[key] }}</span>
                  <span>幸运 {{ set.luck }}</span>
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div v-if="selectedSet !== null" class="attr-form">
          <p class="attr-form-title">已选属性：</p>
          <div class="selected-attrs">
            <div v-for="key in attrKeys" :key="key" class="attr-chip readonly">
              <span class="chip-label">{{ attrMap[key] }}</span>
              <span class="chip-value">{{ form[key] }}</span>
            </div>
            <div class="attr-chip luck readonly">
              <span class="chip-label">幸运</span>
              <span class="chip-value">{{ form.luck }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 购点法模式 -->
      <div v-else>
        <div class="step-hint">
          <p>购点法：将 <strong>460 点</strong>分配到 8 个属性，每个属性范围 <strong>40–90</strong>。</p>
          <p>幸运值单独掷骰（3d6×5）。保存时系统会根据<strong>年龄</strong>自动应用年龄补正。</p>
        </div>

        <div class="point-buy-bar">
          <div class="remaining" :class="{ over: remainingPoints < 0, exact: remainingPoints === 0 }">
            剩余点数：{{ remainingPoints }} / 460
          </div>
          <n-button size="small" @click="resetPointBuy">重置</n-button>
          <n-button size="small" type="primary" @click="rollLuck">掷幸运</n-button>
        </div>

        <div class="attr-grid">
          <div v-for="key in attrKeys" :key="key" class="attr-cell">
            <label>{{ attrMap[key] }}</label>
            <n-slider v-model:value="pointBuy[key]" :min="40" :max="90" :step="1" />
            <n-input-number v-model:value="pointBuy[key]" :min="40" :max="90" style="width: 90px" />
          </div>
          <div class="attr-cell luck">
            <label>幸运</label>
            <n-input-number v-model:value="form.luck" :min="1" :max="99" style="width: 90px" />
            <span v-if="form.luck" class="luck-hint">已掷出 {{ form.luck }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: 职业与技能 -->
    <div v-if="step === 2" class="step-content">
      <n-form-item label="职业">
        <n-select v-model:value="form.occupationId" :options="occupationOptions" placeholder="选择职业" clearable />
      </n-form-item>

      <!-- 职业详情 -->
      <div v-if="selectedOccupation" class="occupation-card">
        <div class="occ-header">
          <h4>{{ selectedOccupation.name }}</h4>
          <n-tag size="small">{{ selectedOccupation.era || '现代' }}</n-tag>
        </div>
        <div class="occ-body">
          <p><strong>点数公式：</strong>{{ selectedOccupation.pointFormulaDesc || selectedOccupation.pointFormula || 'EDU × 4' }}</p>
          <p><strong>信用范围：</strong>{{ selectedOccupation.creditMin }} ~ {{ selectedOccupation.creditMax }}</p>
          <div class="occ-skills">
            <span class="label">本职技能：</span>
            <n-space size="small">
              <n-tag v-for="skill in occupationSkills" :key="skill.id" size="small" type="warning">{{ skill.name }}</n-tag>
            </n-space>
          </div>
          <div v-if="anyTalentCount > 0" class="occ-any">
            <span class="label">任意技能位：</span>
            <span>{{ anyTalentCount }} 个（可从全部技能中自选）</span>
          </div>
        </div>
      </div>

      <!-- 信用等级 -->
      <n-form-item v-if="selectedOccupation" label="信用等级">
        <n-slider v-model:value="form.creditRating" :min="selectedOccupation.creditMin" :max="selectedOccupation.creditMax" :step="1" style="max-width: 400px;" />
        <span class="credit-val">{{ form.creditRating }}</span>
      </n-form-item>

      <!-- 资产（由信用等级自动计算） -->
      <div v-if="selectedOccupation" class="assets-section">
        <p class="section-title">资产与生活水平（由信用等级自动计算）</p>
        <div class="assets-grid">
          <div class="asset-chip">
            <span class="chip-label">生活水平</span>
            <span class="chip-value">{{ livingStandardText(form.livingStandard) }}</span>
          </div>
          <div class="asset-chip">
            <span class="chip-label">现金 ($)</span>
            <span class="chip-value">{{ form.cash?.toLocaleString?.() || form.cash }}</span>
          </div>
          <div class="asset-chip">
            <span class="chip-label">资产 ($)</span>
            <span class="chip-value">{{ form.assets?.toLocaleString?.() || form.assets }}</span>
          </div>
          <div class="asset-chip">
            <span class="chip-label">消费水平 ($)</span>
            <span class="chip-value">{{ form.spendingLevel?.toLocaleString?.() || form.spendingLevel }}</span>
          </div>
        </div>
      </div>

      <!-- 任意技能选择 -->
      <div v-if="selectedOccupation && anyTalentCount > 0" class="any-talent-section">
        <p class="section-title">自选本职技能（{{ extraOccupationalSkillIds.length }} / {{ anyTalentCount }}）</p>
        <n-select
          v-model:value="extraOccupationalSkillIds"
          multiple
          :options="extraSkillOptions"
          :max-tag-count="3"
          placeholder="选择额外本职技能"
          style="max-width: 600px;"
        />
      </div>

      <!-- 技能分配 -->
      <div v-if="selectedOccupation" class="skill-section">
        <div class="points-bar">
          <div class="point-item" :class="{ over: remainingOccupationalPoints < 0 }">
            职业技能点：{{ occupationalPointsUsed }} / {{ occupationalPointsTotal }}
            <span class="hint">（剩余 {{ remainingOccupationalPoints }}）</span>
          </div>
          <div class="point-item" :class="{ over: remainingInterestPoints < 0 }">
            兴趣点数：{{ interestPointsUsed }} / {{ interestPointsTotal }}
            <span class="hint">（剩余 {{ remainingInterestPoints }}）</span>
          </div>
        </div>

        <div class="skill-filter-bar">
          <n-radio-group v-model:value="skillFilter">
            <n-radio-button value="all">全部技能</n-radio-button>
            <n-radio-button value="occupational">本职技能</n-radio-button>
          </n-radio-group>
          <n-input v-model:value="skillSearch" placeholder="搜索技能" clearable style="width: 200px;" />
        </div>

        <div class="skill-table">
          <div class="skill-row header">
            <span class="col-name">技能</span>
            <span class="col-base">基础</span>
            <span class="col-occ">职业点</span>
            <span class="col-int">兴趣点</span>
            <span class="col-total">总值</span>
          </div>
          <div v-for="skill in filteredSkills" :key="skill.id" class="skill-row">
            <span class="col-name" :class="{ occupational: isOccupationalSkill(skill.id) }">
              {{ skill.name }}
              <n-tag v-if="isOccupationalSkill(skill.id)" size="small" type="warning" style="margin-left: 4px;">本职</n-tag>
            </span>
            <span class="col-base">{{ skill.baseValue }}</span>
            <span class="col-occ">
              <n-input-number
                v-if="skill.id !== 18"
                v-model:value="skillAllocation[skill.id].occupational"
                :disabled="!isOccupationalSkill(skill.id)"
                :min="0"
                :max="getMaxOccupational(skill.id)"
                size="small"
                style="width: 80px;"
              />
              <span v-else class="static-val">{{ form.creditRating }}</span>
            </span>
            <span class="col-int">
              <n-input-number
                v-model:value="skillAllocation[skill.id].interest"
                :min="0"
                :max="getMaxInterest(skill.id)"
                size="small"
                style="width: 80px;"
              />
            </span>
            <span class="col-total">{{ getSkillTotal(skill.id) }}</span>
          </div>
        </div>
      </div>

      <n-empty v-if="!selectedOccupation" description="请先选择一个职业" />
    </div>

    <!-- Step 4: 背景 -->
    <div v-if="step === 3" class="step-content">
      <n-form :model="form" label-placement="top">
        <n-form-item label="形象描述">
          <n-input v-model:value="form.description" type="textarea" :rows="3" placeholder="外貌、着装、举止等" />
        </n-form-item>
        <n-form-item label="信仰/信念">
          <n-input v-model:value="form.belief" type="textarea" :rows="2" placeholder="宗教、道德准则、人生信条" />
        </n-form-item>
        <n-form-item label="重要之人">
          <n-input v-model:value="form.significantPeople" type="textarea" :rows="2" placeholder="父母、伴侣、导师、挚友等" />
        </n-form-item>
        <n-form-item label="意义非凡之地">
          <n-input v-model:value="form.meaningfulLocations" type="textarea" :rows="2" placeholder="故乡、求学之地、重要事件发生地" />
        </n-form-item>
        <n-form-item label="珍贵之物">
          <n-input v-model:value="form.treasuredPossessions" type="textarea" :rows="2" placeholder="传家宝、纪念品、象征物" />
        </n-form-item>
        <n-form-item label="特质">
          <n-input v-model:value="form.traits" type="textarea" :rows="2" placeholder="性格特点、口头禅、习惯" />
        </n-form-item>
        <n-form-item label="伤痕与疤痕">
          <n-input v-model:value="form.injuriesAndScars" type="textarea" :rows="2" placeholder="身体创伤、手术痕迹" />
        </n-form-item>
        <n-form-item label="恐惧症与躁狂症">
          <n-input v-model:value="form.phobiasAndManias" type="textarea" :rows="2" placeholder="已知的恐惧或狂热症状" />
        </n-form-item>
        <n-form-item label="典籍、法术与奇物">
          <n-input v-model:value="form.tomesSpellsArtifacts" type="textarea" :rows="2" placeholder="掌握的神秘知识或持有的异常物品" />
        </n-form-item>
        <n-form-item label="与怪奇遭遇">
          <n-input v-model:value="form.encountersWithStrange" type="textarea" :rows="2" placeholder="与神话生物或超自然现象的接触经历" />
        </n-form-item>
        <n-form-item label="盟友与组织">
          <n-input v-model:value="form.alliesAndOrganizations" type="textarea" :rows="2" placeholder="认识的盟友、所属的组织或机构" />
        </n-form-item>
        <n-form-item label="掌握的法术">
          <n-input v-model:value="form.spells" type="textarea" :rows="2" placeholder="已学习的法术及其代价" />
        </n-form-item>
        <n-form-item label="笔记">
          <n-input v-model:value="form.notes" type="textarea" :rows="3" placeholder="玩家备注、KP提示、剧情记录等" />
        </n-form-item>
      </n-form>
    </div>

    <!-- Step 5: 装备与资产 -->
    <div v-if="step === 4" class="step-content">
      <div class="equip-section">
        <div class="equip-header">
          <h4>武器</h4>
          <n-button size="small" @click="addWeapon">新增武器</n-button>
        </div>
        <div v-if="invWeapons.length" class="equip-list">
          <div v-for="(w, i) in invWeapons" :key="i" class="equip-row">
            <n-select v-model:value="w.weaponId" :options="weaponOptions" placeholder="选择武器" style="width: 200px" @update:value="(id: any) => onWeaponSelect(i, id)" />
            <n-input-number v-model:value="w.successRate" placeholder="成功率" style="width: 90px" />
            <n-input-number v-if="hasAmmoCapacity(w.weaponId)" v-model:value="w.currentAmmo" placeholder="弹药" style="width: 90px" />
            <span v-else class="no-ammo">近战</span>
            <n-switch v-model:value="w.isJammed"><span>故障</span></n-switch>
            <n-button size="tiny" type="error" @click="invWeapons.splice(i, 1)">删除</n-button>
          </div>
        </div>
        <n-empty v-else description="未携带武器" />
      </div>

      <div class="equip-section">
        <div class="equip-header">
          <h4>防具</h4>
          <n-button size="small" @click="addArmor">新增防具</n-button>
        </div>
        <div v-if="invArmors.length" class="equip-list">
          <div v-for="(a, i) in invArmors" :key="i" class="equip-row">
            <n-select v-model:value="a.armorId" :options="armorOptions" placeholder="选择防具" style="width: 200px" @update:value="(id: any) => onArmorSelect(i, id)" />
            <span class="armor-durability">耐久: {{ a.currentDurability ?? '-' }}</span>
            <n-switch v-model:value="a.isEquipped"><span>装备中</span></n-switch>
            <n-button size="tiny" type="error" @click="invArmors.splice(i, 1)">删除</n-button>
          </div>
        </div>
        <n-empty v-else description="未装备防具" />
      </div>

      <div class="equip-section">
        <div class="equip-header">
          <h4>载具</h4>
          <n-button size="small" @click="addVehicle">新增载具</n-button>
        </div>
        <div v-if="invVehicles.length" class="equip-list">
          <div v-for="(v, i) in invVehicles" :key="i" class="equip-row">
            <n-select v-model:value="v.vehicleId" :options="vehicleOptions" placeholder="选择载具" style="width: 200px" />
            <n-input v-model:value="v.customName" placeholder="自定义名称" style="width: 150px" />
            <n-button size="tiny" type="error" @click="invVehicles.splice(i, 1)">删除</n-button>
          </div>
        </div>
        <n-empty v-else description="未拥有载具" />
      </div>

      <div class="equip-section">
        <div class="equip-header">
          <h4>其他资产</h4>
          <n-button size="small" @click="addOtherAsset">新增资产</n-button>
        </div>
        <div v-if="invOtherAssets.length" class="equip-list">
          <div v-for="(a, i) in invOtherAssets" :key="i" class="equip-row">
            <n-select v-model:value="a.category" :options="assetCategoryOptions" placeholder="分类" style="width: 120px" />
            <n-input v-model:value="a.name" placeholder="名称" style="width: 160px" />
            <n-input-number v-model:value="a.value" placeholder="价值" style="width: 100px" />
            <n-input v-model:value="a.description" placeholder="描述" style="width: 200px" />
            <n-button size="tiny" type="error" @click="invOtherAssets.splice(i, 1)">删除</n-button>
          </div>
        </div>
        <n-empty v-else description="无其他资产" />
      </div>
    </div>

    <div class="actions">
      <n-button v-if="step === 0" @click="router.push('/investigators')">返回</n-button>
      <n-button v-if="step > 0" @click="step--">上一步</n-button>
      <n-button v-if="step < 4" type="primary" @click="step++">下一步</n-button>
      <n-button v-if="step === 4" type="primary" :loading="saving" @click="save">保存角色卡</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const isEdit = computed(() => !!route.params.id)
const editId = computed(() => route.params.id as string)

const step = ref(0)
const loading = ref(false)
const rolling = ref(false)
const saving = ref(false)
const rolledSets = ref<any[]>([])
const selectedSetIndex = ref<number | null>(null)
const occupations = ref<any[]>([])
const rollMethod = ref<'dice' | 'point_buy'>('dice')
const skills = ref<any[]>([])
const skillAllocation = ref<Record<number, { occupational: number; interest: number }>>({})
const extraOccupationalSkillIds = ref<number[]>([])
const skillFilter = ref<'all' | 'occupational'>('all')
const skillSearch = ref('')

// 配置库选项
const weaponLibrary = ref<any[]>([])
const armorLibrary = ref<any[]>([])
const vehicleLibrary = ref<any[]>([])

// 调查员装备与资产
const invWeapons = ref<any[]>([])
const invArmors = ref<any[]>([])
const invVehicles = ref<any[]>([])
const invOtherAssets = ref<any[]>([])

const assetCategoryOptions = [
  { label: '车辆', value: 'vehicle' },
  { label: '住所', value: 'residence' },
  { label: '奢侈品', value: 'luxury' },
  { label: '股票', value: 'stock' },
  { label: '其他', value: 'other' },
]

const weaponOptions = computed(() => weaponLibrary.value.map((w: any) => ({ label: w.name, value: w.id })))
const armorOptions = computed(() => armorLibrary.value.map((a: any) => ({ label: a.name, value: a.id })))
const vehicleOptions = computed(() => vehicleLibrary.value.map((v: any) => ({ label: v.name, value: v.id })))

const eraOptions = [
  { label: '现代', value: 'MODERN' },
  { label: '1920s', value: 'Y1920S' },
  { label: '煤气灯', value: 'GASLIGHT' },
  { label: 'Pulp', value: 'PULP' },
]

// COC七版资产参考表（源自Excel空白卡CY20.02.2）
// 现金 = CR × 倍率，其他资产 = CR × 倍率（CR=0和CR=99为固定值）
function calcAssetsFromCreditRating(cr: number, era: string) {
  const isModern = era === 'MODERN'
  let cash = 0
  let assets = 0
  let ls = 'DESTITUTE'

  if (cr === 0) {
    cash = isModern ? 10 : 0.5
    assets = 0
    ls = 'DESTITUTE'
  } else if (cr >= 1 && cr <= 9) {
    cash = isModern ? cr * 20 : cr * 1
    assets = isModern ? cr * 200 : cr * 10
    ls = 'POOR'
  } else if (cr >= 10 && cr <= 49) {
    cash = isModern ? cr * 40 : cr * 2
    assets = isModern ? cr * 1000 : cr * 50
    ls = 'AVERAGE'
  } else if (cr >= 50 && cr <= 89) {
    cash = isModern ? cr * 100 : cr * 5
    assets = isModern ? cr * 10000 : cr * 500
    ls = 'COMFORTABLE'
  } else if (cr >= 90 && cr <= 98) {
    cash = isModern ? cr * 400 : cr * 20
    assets = isModern ? cr * 40000 : cr * 2000
    ls = 'WEALTHY'
  } else if (cr >= 99) {
    cash = isModern ? 1000000 : 50000
    assets = isModern ? 100000000 : 5000000
    ls = 'RICH'
  }

  return { cash, assets, spendingLevel: cash, livingStandard: ls }
}

const occupationOptions = ref<{ label: string; value: number }[]>([])

type AttrKey = 'str' | 'con' | 'siz' | 'dex' | 'app' | 'int' | 'pow' | 'edu'
const attrKeys: AttrKey[] = ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']
const attrMap: Record<AttrKey | string, string> = {
  str: '力量', con: '体质', siz: '体型', dex: '敏捷',
  app: '外貌', int: '智力', pow: '意志', edu: '教育',
}

interface AttrValues {
  str: number; con: number; siz: number; dex: number
  app: number; int: number; pow: number; edu: number
}

const form = ref<AttrValues & {
  name: string; era: string; age: number; gender: string
  residence: string; birthplace: string; luck: number
  occupationId: number | null; creditRating: number
  cash: number; assets: number; spendingLevel: number; livingStandard: string
  description: string; belief: string
  significantPeople: string; meaningfulLocations: string
  treasuredPossessions: string; traits: string
  injuriesAndScars: string; phobiasAndManias: string
  tomesSpellsArtifacts: string; encountersWithStrange: string
  alliesAndOrganizations: string; spells: string; notes: string
}>({
  name: '', era: 'MODERN', age: 25, gender: '', residence: '', birthplace: '',
  str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50, luck: 50,
  occupationId: null, creditRating: 0, cash: 0, assets: 0, spendingLevel: 0, livingStandard: '',
  description: '', belief: '',
  significantPeople: '', meaningfulLocations: '',
  treasuredPossessions: '', traits: '',
  injuriesAndScars: '', phobiasAndManias: '',
  tomesSpellsArtifacts: '', encountersWithStrange: '',
  alliesAndOrganizations: '', spells: '', notes: '',
})

const pointBuy = ref<AttrValues>({
  str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50,
})

const selectedSet = computed(() =>
  selectedSetIndex.value !== null ? rolledSets.value[selectedSetIndex.value] : null
)

const remainingPoints = computed(() => {
  const used = attrKeys.reduce((sum, k) => sum + pointBuy.value[k], 0)
  return 460 - used
})

const ageAdjustmentText = computed(() => {
  const age = form.value.age
  if (age >= 15 && age <= 19) return '力量-5、体型-5、教育-5；1次教育增强检定'
  if (age >= 20 && age <= 39) return '无属性减值；1次教育增强检定'
  if (age >= 40 && age <= 49) return '力量-5、体质-5、敏捷-5、外貌-5；2次教育增强检定；MOV-1'
  if (age >= 50 && age <= 59) return '力量-10、体质-10、敏捷-10、外貌-10；3次教育增强检定；MOV-2'
  if (age >= 60 && age <= 69) return '力量-20、体质-20、敏捷-20、外貌-15；4次教育增强检定；MOV-3'
  if (age >= 70 && age <= 79) return '力量-40、体质-40、敏捷-40、外貌-20；4次教育增强检定；MOV-4'
  if (age >= 80) return '力量-80、体质-80、敏捷-80、外貌-25；4次教育增强检定；MOV-5'
  return ''
})

// 职业相关计算属性
const selectedOccupation = computed(() => {
  if (!form.value.occupationId) return null
  return occupations.value.find((o: any) => o.id === form.value.occupationId)
})

const occupationSkillIds = computed(() => {
  if (!selectedOccupation.value) return []
  try {
    return JSON.parse(selectedOccupation.value.skillIds || '[]')
  } catch {
    return []
  }
})

const occupationSkills = computed(() => {
  const ids = occupationSkillIds.value.filter((id: number) => id > 0)
  return skills.value.filter((s: any) => ids.includes(s.id))
})

const anyTalentCount = computed(() => selectedOccupation.value?.anyTalentCount || 0)

const occupationalPointsTotal = computed(() => (form.value.edu || 50) * 4)
const interestPointsTotal = computed(() => (form.value.int || 50) * 2)

const occupationalPointsUsed = computed(() => {
  let sum = 0
  Object.values(skillAllocation.value).forEach((s) => {
    sum += s?.occupational || 0
  })
  return sum
})

const interestPointsUsed = computed(() => {
  let sum = 0
  Object.values(skillAllocation.value).forEach((s) => {
    sum += s?.interest || 0
  })
  return sum
})

const remainingOccupationalPoints = computed(() => occupationalPointsTotal.value - occupationalPointsUsed.value)
const remainingInterestPoints = computed(() => interestPointsTotal.value - interestPointsUsed.value)

function isOccupationalSkill(skillId: number) {
  const fixedIds = occupationSkillIds.value.filter((id: number) => id > 0)
  return fixedIds.includes(skillId) || extraOccupationalSkillIds.value.includes(skillId)
}

const extraSkillOptions = computed(() => {
  const fixedIds = occupationSkillIds.value.filter((id: number) => id > 0)
  const maxed = extraOccupationalSkillIds.value.length >= anyTalentCount.value
  return skills.value
    .filter((s: any) => !fixedIds.includes(s.id))
    .map((s: any) => ({
      label: s.name,
      value: s.id,
      disabled: maxed && !extraOccupationalSkillIds.value.includes(s.id),
    }))
})

const filteredSkills = computed(() => {
  let list = skills.value
  if (skillFilter.value === 'occupational') {
    list = list.filter((s: any) => isOccupationalSkill(s.id))
  }
  if (skillSearch.value.trim()) {
    const q = skillSearch.value.trim().toLowerCase()
    list = list.filter((s: any) => s.name.toLowerCase().includes(q))
  }
  return list
})

// 同步购点法数值到 form
watch(pointBuy, (pb) => {
  if (rollMethod.value === 'point_buy') {
    attrKeys.forEach((k) => {
      (form.value as any)[k] = (pb as any)[k]
    })
  }
}, { deep: true })

watch(selectedSetIndex, (idx) => {
  if (idx !== null && rolledSets.value[idx]) {
    const set = rolledSets.value[idx]
    attrKeys.forEach((k) => {
      (form.value as any)[k] = set[k]
    })
    form.value.luck = set.luck
  }
})

watch(rollMethod, (method) => {
  if (method === 'point_buy') {
    attrKeys.forEach((k) => {
      (form.value as any)[k] = (pointBuy.value as any)[k]
    })
  }
})

watch(() => form.value.occupationId, (newId) => {
  extraOccupationalSkillIds.value = []
  Object.keys(skillAllocation.value).forEach((key) => {
    const k = Number(key)
    if (skillAllocation.value[k]) {
      skillAllocation.value[k].occupational = 0
    }
  })
  const occ = occupations.value.find((o: any) => o.id === newId)
  form.value.creditRating = occ ? occ.creditMin : 0
})

watch(() => form.value.creditRating, (cr) => {
  const calc = calcAssetsFromCreditRating(cr || 0, form.value.era)
  form.value.cash = calc.cash
  form.value.assets = calc.assets
  form.value.spendingLevel = calc.spendingLevel
  form.value.livingStandard = calc.livingStandard
}, { immediate: true })

watch(() => form.value.era, (era) => {
  const calc = calcAssetsFromCreditRating(form.value.creditRating || 0, era)
  form.value.cash = calc.cash
  form.value.assets = calc.assets
  form.value.spendingLevel = calc.spendingLevel
  form.value.livingStandard = calc.livingStandard
})

function livingStandardText(ls: string) {
  const map: Record<string, string> = {
    DESTITUTE: '身无分文', POOR: '拮据', AVERAGE: '标准', COMFORTABLE: '小康', WEALTHY: '富裕', RICH: '富豪',
  }
  return map[ls] || ls || '-'
}

onMounted(async () => {
  loading.value = true
  try {
    const [occRes, skillRes, weaponRes, armorRes, vehicleRes] = await Promise.all([
      api.get('/occupations'),
      api.get('/skills'),
      api.get('/weapons'),
      api.get('/armors'),
      api.get('/vehicles'),
    ])
    occupations.value = occRes.data
    occupationOptions.value = occRes.data.map((o: any) => ({ label: o.name, value: o.id }))
    skills.value = skillRes.data
    initSkillAllocation()
    weaponLibrary.value = weaponRes.data
    armorLibrary.value = armorRes.data
    vehicleLibrary.value = vehicleRes.data

    if (isEdit.value) {
      await loadInvestigatorData()
    }
  } finally {
    loading.value = false
  }
})

async function loadInvestigatorData() {
  try {
    const res = await api.get(`/investigators/${editId.value}`)
    const inv = res.data

    // 填充基础信息
    form.value.name = inv.name || ''
    form.value.era = inv.era || 'MODERN'
    form.value.age = inv.age || 25
    form.value.gender = inv.gender || ''
    form.value.residence = inv.residence || ''
    form.value.birthplace = inv.birthplace || ''
    form.value.luck = inv.luck || 50

    // 填充属性
    attrKeys.forEach((k) => {
      (form.value as any)[k] = inv[k] ?? 50
    })

    // 判断是掷骰还是购点法：如果所有属性都在40-90之间且总和为460，认为是购点法
    const total = attrKeys.reduce((sum, k) => sum + ((inv[k] as number) || 50), 0)
    const allInRange = attrKeys.every((k) => {
      const v = (inv[k] as number) || 50
      return v >= 40 && v <= 90
    })
    if (allInRange && total === 460) {
      rollMethod.value = 'point_buy'
      attrKeys.forEach((k) => {
        (pointBuy.value as any)[k] = (inv[k] as number) || 50
      })
    } else {
      rollMethod.value = 'dice'
      rolledSets.value = [{
        str: inv.str, con: inv.con, siz: inv.siz, dex: inv.dex,
        app: inv.app, int: inv.int, pow: inv.pow, edu: inv.edu,
        luck: inv.luck,
      }]
      selectedSetIndex.value = 0
    }

    // 填充职业
    form.value.occupationId = inv.occupationId || null
    form.value.creditRating = inv.creditRating || 0

    // 资产会在 creditRating watch 中自动计算

    // 填充背景
    form.value.description = inv.description || ''
    form.value.belief = inv.belief || ''
    form.value.significantPeople = inv.significantPeople || ''
    form.value.meaningfulLocations = inv.meaningfulLocations || ''
    form.value.treasuredPossessions = inv.treasuredPossessions || ''
    form.value.traits = inv.traits || ''
    form.value.injuriesAndScars = inv.injuriesAndScars || ''
    form.value.phobiasAndManias = inv.phobiasAndManias || ''
    form.value.tomesSpellsArtifacts = inv.tomesSpellsArtifacts || ''
    form.value.encountersWithStrange = inv.encountersWithStrange || ''
    form.value.alliesAndOrganizations = inv.alliesAndOrganizations || ''
    form.value.spells = inv.spells || ''
    form.value.notes = inv.notes || ''

    // 填充技能分配
    if (inv.skills && inv.skills.length > 0) {
      const occ = occupations.value.find((o: any) => o.id === inv.occupationId)
      let fixedIds: number[] = []
      if (occ) {
        try { fixedIds = JSON.parse(occ.skillIds || '[]').filter((id: number) => id > 0) } catch { }
      }

      inv.skills.forEach((s: any) => {
        const skillId = s.skillId
        if (!skillId || !skillAllocation.value[skillId]) return
        skillAllocation.value[skillId].occupational = s.occupational || 0
        skillAllocation.value[skillId].interest = s.interest || 0

        // 判断是否是额外自选本职技能
        if (s.isOccupational && !fixedIds.includes(skillId)) {
          if (!extraOccupationalSkillIds.value.includes(skillId)) {
            extraOccupationalSkillIds.value.push(skillId)
          }
        }
      })
    }

    // 填充装备与资产
    invWeapons.value = (inv.weapons || []).map((w: any) => ({
      weaponId: w.weaponId,
      customName: w.customName || '',
      successRate: w.successRate || 0,
      currentAmmo: w.currentAmmo,
      isJammed: w.isJammed || false,
      description: w.description || '',
    }))
    invArmors.value = (inv.armors || []).map((a: any) => ({
      armorId: a.armorId,
      currentDurability: a.currentDurability,
      isEquipped: a.isEquipped || false,
      description: a.description || '',
    }))
    invVehicles.value = (inv.vehicles || []).map((v: any) => ({
      vehicleId: v.vehicleId,
      customName: v.customName || '',
      description: v.description || '',
    }))
    invOtherAssets.value = (inv.otherAssets || []).map((a: any) => ({
      category: a.category,
      name: a.name,
      value: a.value || 0,
      description: a.description || '',
    }))
  } catch (e) {
    message.error('加载角色卡数据失败')
    router.push('/investigators')
  }
}

function addWeapon() {
  invWeapons.value.push({ weaponId: null, customName: '', successRate: 0, currentAmmo: null, isJammed: false, description: '' })
}
function addArmor() {
  invArmors.value.push({ armorId: null, currentDurability: null, isEquipped: false, description: '' })
}
function addVehicle() {
  invVehicles.value.push({ vehicleId: null, customName: '', description: '' })
}
function addOtherAsset() {
  invOtherAssets.value.push({ category: 'other', name: '', value: 0, description: '' })
}

function hasAmmoCapacity(weaponId: number | null): boolean {
  if (!weaponId) return false
  const w = weaponLibrary.value.find((x: any) => x.id === weaponId)
  return w?.ammoCapacity > 0
}

function onWeaponSelect(index: number, weaponId: number) {
  const w = weaponLibrary.value.find((x: any) => x.id === weaponId)
  if (w) {
    const item = invWeapons.value[index]
    item.currentAmmo = w.ammoCapacity ? Number(w.ammoCapacity) : null
  }
}

function onArmorSelect(index: number, armorId: number) {
  const a = armorLibrary.value.find((x: any) => x.id === armorId)
  if (a) {
    const item = invArmors.value[index]
    item.currentDurability = a.armorValue
  }
}

function initSkillAllocation() {
  const alloc: Record<number, any> = {}
  skills.value.forEach((s: any) => {
    alloc[s.id] = { occupational: 0, interest: 0 }
  })
  skillAllocation.value = alloc
}

async function rollAttributes() {
  rolling.value = true
  try {
    const res = await api.post('/dice/attributes', {})
    rolledSets.value = res.data.sets || []
    selectedSetIndex.value = null
  } catch (e) {
    message.error('掷骰失败')
  } finally {
    rolling.value = false
  }
}

function resetPointBuy() {
  pointBuy.value = { str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50 }
}

async function rollLuck() {
  try {
    const res = await api.post('/dice/attributes', { method: 'standard' })
    const set = res.data.sets?.[0]
    if (set) {
      form.value.luck = set.luck
    }
  } catch (e) {
    message.error('掷幸运失败')
  }
}

function getSkillTotal(skillId: number) {
  const alloc = skillAllocation.value[skillId]
  const skill = skills.value.find((s: any) => s.id === skillId)
  if (!alloc || !skill) return 0
  let occ = alloc.occupational || 0
  if (skillId === 18) occ = form.value.creditRating
  return skill.baseValue + occ + (alloc.interest || 0)
}

function getMaxOccupational(skillId: number) {
  const skill = skills.value.find((s: any) => s.id === skillId)
  if (!skill) return 0
  const currentInterest = skillAllocation.value[skillId]?.interest || 0
  const currentOcc = skillAllocation.value[skillId]?.occupational || 0
  return Math.min(99 - skill.baseValue - currentInterest, remainingOccupationalPoints.value + currentOcc)
}

function getMaxInterest(skillId: number) {
  const skill = skills.value.find((s: any) => s.id === skillId)
  if (!skill) return 0
  const currentOcc = skillAllocation.value[skillId]?.occupational || 0
  const currentInt = skillAllocation.value[skillId]?.interest || 0
  return Math.min(99 - skill.baseValue - currentOcc, remainingInterestPoints.value + currentInt)
}

async function save() {
  if (rollMethod.value === 'point_buy' && remainingPoints.value !== 0) {
    message.error(`购点法剩余点数必须为0，当前剩余 ${remainingPoints.value} 点`)
    return
  }

  const skillsPayload = Object.entries(skillAllocation.value)
    .filter(([skillId, v]) => {
      const id = Number(skillId)
      const occ = id === 18 ? form.value.creditRating : (v.occupational || 0)
      return occ > 0 || (v.interest || 0) > 0
    })
    .map(([skillId, v]) => {
      const id = Number(skillId)
      const skill = skills.value.find((s: any) => s.id === id)
      let occ = v.occupational || 0
      if (id === 18) occ = form.value.creditRating
      return {
        skillId: id,
        initial: skill?.baseValue || 0,
        occupational: occ,
        interest: v.interest || 0,
        isOccupational: isOccupationalSkill(id),
      }
    })

  saving.value = true
  try {
    const data = {
      ...form.value,
      skills: skillsPayload,
      weapons: invWeapons.value.filter((w: any) => w.weaponId),
      armors: invArmors.value.filter((a: any) => a.armorId),
      vehicles: invVehicles.value.filter((v: any) => v.vehicleId),
      otherAssets: invOtherAssets.value.filter((a: any) => a.name),
    }
    if (isEdit.value) {
      await api.patch(`/investigators/${editId.value}`, data)
      message.success('角色卡保存成功')
      router.push(`/investigator/${editId.value}`)
    } else {
      await api.post('/investigators', data)
      message.success('角色卡创建成功')
      router.push('/investigators')
    }
  } catch (e: any) {
    message.error(e.response?.data?.message || (isEdit.value ? '保存失败' : '创建失败'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.steps { margin-bottom: 2rem; }
.step-content { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; }
.mode-switch { margin-bottom: 1.5rem; }
.step-hint { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; color: #333; }
.step-hint p { margin: 0 0 0.4rem; line-height: 1.5; }
.step-hint p:last-child { margin-bottom: 0; }
.roll-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.sets { margin-bottom: 1.5rem; }
.sets-title { font-weight: 500; margin-bottom: 0.75rem; color: #333; }
.set-row { display: flex; gap: 0.75rem; font-size: 0.9rem; flex-wrap: wrap; }
.attr-form { background: #f9f9f5; padding: 1.2rem; border-radius: 8px; }
.attr-form-title { font-weight: 500; margin-bottom: 0.75rem; color: #333; }
.selected-attrs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.attr-chip { background: #fff; border: 2px solid #e8e8e3; border-radius: 8px; padding: 0.6rem; text-align: center; transition: all 0.2s; }
.attr-chip.readonly { cursor: default; }
.attr-chip.luck { opacity: 0.8; }
.chip-label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.2rem; }
.chip-value { display: block; font-size: 1.2rem; font-weight: 600; color: #333; }
.point-buy-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
.remaining { font-size: 1.1rem; font-weight: 600; }
.remaining.over { color: #d9534f; }
.remaining.exact { color: #18a058; }
.attr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.attr-cell { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.75rem; background: #f9f9f5; border-radius: 8px; }
.attr-cell label { font-size: 0.9rem; color: #555; font-weight: 500; }
.luck-hint { font-size: 0.8rem; color: #888; }
.actions { display: flex; gap: 1rem; justify-content: flex-end; }
.tip { color: #999; font-size: 0.9rem; }
.age-adjustment-hint { background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; }
.age-adjustment-hint .age-title { font-weight: 600; color: #ad6800; margin-bottom: 0.3rem; }
.age-adjustment-hint p { margin: 0; color: #666; font-size: 0.9rem; }

/* 职业与技能 */
.occupation-card { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; }
.occ-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.occ-header h4 { margin: 0; color: #333; }
.occ-body p { margin: 0.25rem 0; color: #555; font-size: 0.9rem; }
.occ-skills { display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.9rem; }
.occ-skills .label { color: #555; white-space: nowrap; margin-top: 2px; }
.occ-any { font-size: 0.9rem; color: #555; margin-top: 0.5rem; }
.credit-val { margin-left: 1rem; font-weight: 600; color: #333; }
.any-talent-section { margin-bottom: 1.5rem; }
.any-talent-section .section-title { font-weight: 500; color: #333; margin-bottom: 0.5rem; }
.skill-section { margin-top: 1.5rem; }
.points-bar { display: flex; gap: 2rem; margin-bottom: 1rem; padding: 0.75rem 1rem; background: #f9f9f5; border-radius: 8px; }
.point-item { font-weight: 500; color: #333; }
.point-item.over { color: #d9534f; }
.point-item .hint { color: #888; font-weight: normal; margin-left: 0.25rem; }
.skill-filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.skill-table { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
.skill-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 0.5rem; padding: 0.5rem 0.75rem; align-items: center; border-bottom: 1px solid #f0f0f0; }
.skill-row:last-child { border-bottom: none; }
.skill-row.header { background: #fafafa; font-weight: 500; color: #666; font-size: 0.85rem; }
.col-name { font-size: 0.9rem; color: #333; }
.col-name.occupational { color: #8B4513; font-weight: 500; }
.col-base, .col-occ, .col-int, .col-total { text-align: center; font-size: 0.9rem; color: #555; }
.col-total { font-weight: 600; color: #333; }
.static-val { display: inline-block; width: 80px; text-align: center; color: #999; font-size: 0.9rem; }
.assets-section { background: #f0f5ff; border: 1px solid #adc6ff; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; }
.assets-section .section-title { font-weight: 500; color: #333; margin-bottom: 0.75rem; }
.assets-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.asset-chip { background: #fff; border: 1px solid #d6e4ff; border-radius: 8px; padding: 0.6rem; text-align: center; }
.asset-chip .chip-label { display: block; font-size: 0.75rem; color: #888; margin-bottom: 0.2rem; }
.asset-chip .chip-value { display: block; font-size: 1.1rem; font-weight: 600; color: #333; }
.equip-section { margin-bottom: 1.5rem; }
.equip-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.equip-header h4 { margin: 0; color: #333; font-size: 1rem; }
.equip-list { display: flex; flex-direction: column; gap: 0.5rem; }
.equip-row { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem; background: #f9f9f5; border-radius: 6px; }
.no-ammo { font-size: 0.85rem; color: #888; width: 90px; text-align: center; }
.armor-durability { font-size: 0.9rem; color: #555; min-width: 80px; }
</style>
