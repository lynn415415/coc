<template>
  <div class="page">
    <h2>创建调查员</h2>

    <n-steps :current="step" class="steps">
      <n-step title="基础信息" />
      <n-step title="Roll属性" />
      <n-step title="职业与技能" />
      <n-step title="背景" />
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
        <n-select v-model:value="form.occupationId" :options="occupationOptions" placeholder="选择职业" />
      </n-form-item>
      <p class="tip">技能分配功能将在后续版本完善，当前保存为草稿后可继续编辑。</p>
    </div>

    <!-- Step 4: 背景 -->
    <div v-if="step === 3" class="step-content">
      <n-form :model="form" label-placement="top">
        <n-form-item label="形象描述">
          <n-input v-model:value="form.description" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="信仰/信念">
          <n-input v-model:value="form.belief" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
    </div>

    <div class="actions">
      <n-button v-if="step === 0" @click="router.push('/investigators')">返回</n-button>
      <n-button v-if="step > 0" @click="step--">上一步</n-button>
      <n-button v-if="step < 3" type="primary" @click="step++">下一步</n-button>
      <n-button v-if="step === 3" type="primary" :loading="saving" @click="save">保存角色卡</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const router = useRouter()
const message = useMessage()

const step = ref(0)
const rolling = ref(false)
const saving = ref(false)
const rolledSets = ref<any[]>([])
const selectedSetIndex = ref<number | null>(null)
const occupations = ref<any[]>([])
const rollMethod = ref<'dice' | 'point_buy'>('dice')

const eraOptions = [
  { label: '现代', value: 'MODERN' },
  { label: '1920s', value: 'Y1920S' },
  { label: '煤气灯', value: 'GASLIGHT' },
  { label: 'Pulp', value: 'PULP' },
]

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
  occupationId: number | null; description: string; belief: string
}>({
  name: '', era: 'MODERN', age: 25, gender: '', residence: '', birthplace: '',
  str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50, luck: 50,
  occupationId: null,
  description: '', belief: '',
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

onMounted(async () => {
  const res = await api.get('/occupations')
  occupations.value = res.data
  occupationOptions.value = res.data.map((o: any) => ({ label: o.name, value: o.id }))
})

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

async function save() {
  if (rollMethod.value === 'point_buy' && remainingPoints.value !== 0) {
    message.error(`购点法剩余点数必须为0，当前剩余 ${remainingPoints.value} 点`)
    return
  }
  saving.value = true
  try {
    const data = { ...form.value }
    await api.post('/investigators', data)
    message.success('角色卡创建成功')
    router.push('/investigators')
  } catch (e: any) {
    message.error(e.response?.data?.message || '创建失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 2rem; }
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
.selected-attrs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
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
</style>
