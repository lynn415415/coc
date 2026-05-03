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
      <div class="step-hint">
        <p>点击「掷骰生成属性组」获得5组随机属性，选择最满意的一组。</p>
        <p>选中后可在下方微调（±5点以内），保存时系统会根据<strong>年龄</strong>自动应用年龄补正并计算衍生属性。</p>
      </div>

      <div v-if="form.age" class="age-adjustment-hint">
        <p class="age-title">当前年龄 {{ form.age }} 岁的补正规则：</p>
        <p>{{ ageAdjustmentText }}</p>
      </div>

      <div class="roll-section">
        <n-button type="primary" @click="rollAttributes" :loading="rolling">掷骰生成属性组</n-button>
        <n-button v-if="rolledSets.length > 0" @click="rollAttributes">重新掷骰</n-button>
      </div>

      <div v-if="rolledSets.length > 0" class="sets">
        <p class="sets-title">选择一组属性（点击圆圈选中）：</p>
        <n-radio-group v-model:value="selectedSetIndex">
          <n-space vertical>
            <n-radio v-for="(set, idx) in rolledSets" :key="idx" :value="idx">
              <div class="set-row">
                <span>{{ attrMap.str }} {{ set.str }}</span>
                <span>{{ attrMap.con }} {{ set.con }}</span>
                <span>{{ attrMap.siz }} {{ set.siz }}</span>
                <span>{{ attrMap.dex }} {{ set.dex }}</span>
                <span>{{ attrMap.app }} {{ set.app }}</span>
                <span>{{ attrMap.int }} {{ set.int }}</span>
                <span>{{ attrMap.pow }} {{ set.pow }}</span>
                <span>{{ attrMap.edu }} {{ set.edu }}</span>
                <span>{{ attrMap.luck }} {{ set.luck }}</span>
              </div>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <div v-if="selectedSetIndex !== null" class="attr-form">
        <p class="attr-form-title">微调属性值（范围：Roll值 ±5）：</p>
        <div class="attr-grid">
          <div class="attr-cell">
            <label>{{ attrMap.str }}</label>
            <n-input-number v-model:value="form.str" :min="attrMin.str" :max="attrMax.str" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.con }}</label>
            <n-input-number v-model:value="form.con" :min="attrMin.con" :max="attrMax.con" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.siz }}</label>
            <n-input-number v-model:value="form.siz" :min="attrMin.siz" :max="attrMax.siz" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.dex }}</label>
            <n-input-number v-model:value="form.dex" :min="attrMin.dex" :max="attrMax.dex" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.app }}</label>
            <n-input-number v-model:value="form.app" :min="attrMin.app" :max="attrMax.app" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.int }}</label>
            <n-input-number v-model:value="form.int" :min="attrMin.int" :max="attrMax.int" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.pow }}</label>
            <n-input-number v-model:value="form.pow" :min="attrMin.pow" :max="attrMax.pow" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.edu }}</label>
            <n-input-number v-model:value="form.edu" :min="attrMin.edu" :max="attrMax.edu" />
          </div>
          <div class="attr-cell">
            <label>{{ attrMap.luck }}</label>
            <n-input-number v-model:value="form.luck" :min="attrMin.luck" :max="attrMax.luck" />
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

const eraOptions = [
  { label: '现代', value: 'MODERN' },
  { label: '1920s', value: 'Y1920S' },
  { label: '煤气灯', value: 'GASLIGHT' },
  { label: 'Pulp', value: 'PULP' },
]

const occupationOptions = ref<{ label: string; value: number }[]>([])

const attrMap: Record<string, string> = {
  str: '力量', con: '体质', siz: '体型', dex: '敏捷',
  app: '外貌', int: '智力', pow: '意志', edu: '教育', luck: '幸运',
}

const form = ref({
  name: '', era: 'MODERN', age: 25, gender: '', residence: '', birthplace: '',
  str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50, luck: 50,
  occupationId: null as number | null,
  description: '', belief: '',
})

const baseValues = ref({
  str: 50, con: 50, siz: 50, dex: 50, app: 50, int: 50, pow: 50, edu: 50, luck: 50,
})

const attrMin = computed(() => ({
  str: Math.max(1, baseValues.value.str - 5),
  con: Math.max(1, baseValues.value.con - 5),
  siz: Math.max(1, baseValues.value.siz - 5),
  dex: Math.max(1, baseValues.value.dex - 5),
  app: Math.max(1, baseValues.value.app - 5),
  int: Math.max(1, baseValues.value.int - 5),
  pow: Math.max(1, baseValues.value.pow - 5),
  edu: Math.max(1, baseValues.value.edu - 5),
  luck: Math.max(1, baseValues.value.luck - 5),
}))

const attrMax = computed(() => ({
  str: Math.min(99, baseValues.value.str + 5),
  con: Math.min(99, baseValues.value.con + 5),
  siz: Math.min(99, baseValues.value.siz + 5),
  dex: Math.min(99, baseValues.value.dex + 5),
  app: Math.min(99, baseValues.value.app + 5),
  int: Math.min(99, baseValues.value.int + 5),
  pow: Math.min(99, baseValues.value.pow + 5),
  edu: Math.min(99, baseValues.value.edu + 5),
  luck: Math.min(99, baseValues.value.luck + 5),
}))

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

watch(selectedSetIndex, (idx) => {
  if (idx !== null && rolledSets.value[idx]) {
    const set = rolledSets.value[idx]
    form.value.str = set.str
    form.value.con = set.con
    form.value.siz = set.siz
    form.value.dex = set.dex
    form.value.app = set.app
    form.value.int = set.int
    form.value.pow = set.pow
    form.value.edu = set.edu
    form.value.luck = set.luck
    baseValues.value = { ...set }
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

async function save() {
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
.step-hint { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; color: #333; }
.step-hint p { margin: 0 0 0.4rem; line-height: 1.5; }
.step-hint p:last-child { margin-bottom: 0; }
.roll-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.sets { margin-bottom: 1.5rem; }
.sets-title { font-weight: 500; margin-bottom: 0.75rem; color: #333; }
.set-row { display: flex; gap: 0.75rem; font-size: 0.9rem; flex-wrap: wrap; }
.attr-form { background: #f9f9f5; padding: 1.2rem; border-radius: 8px; }
.attr-form-title { font-weight: 500; margin-bottom: 0.75rem; color: #333; }
.attr-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
.attr-cell { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
.attr-cell label { font-size: 0.9rem; color: #555; font-weight: 500; }
.attr-cell .n-input-number { width: 120px; }
.actions { display: flex; gap: 1rem; justify-content: flex-end; }
.tip { color: #999; font-size: 0.9rem; }
.age-adjustment-hint { background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; }
.age-adjustment-hint .age-title { font-weight: 600; color: #ad6800; margin-bottom: 0.3rem; }
.age-adjustment-hint p { margin: 0; color: #666; font-size: 0.9rem; }
</style>
