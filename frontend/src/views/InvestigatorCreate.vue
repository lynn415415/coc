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
      <div class="roll-section">
        <n-button type="primary" @click="rollAttributes" :loading="rolling">掷骰生成属性组</n-button>
        <n-button v-if="rolledSets.length > 0" @click="rollAttributes">重新掷骰</n-button>
      </div>

      <div v-if="rolledSets.length > 0" class="sets">
        <p>选择一组属性：</p>
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
        <n-form :model="form" inline>
          <n-form-item :label="attrMap.str"><n-input-number v-model:value="form.str" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.con"><n-input-number v-model:value="form.con" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.siz"><n-input-number v-model:value="form.siz" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.dex"><n-input-number v-model:value="form.dex" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.app"><n-input-number v-model:value="form.app" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.int"><n-input-number v-model:value="form.int" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.pow"><n-input-number v-model:value="form.pow" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.edu"><n-input-number v-model:value="form.edu" :min="1" :max="99" /></n-form-item>
          <n-form-item :label="attrMap.luck"><n-input-number v-model:value="form.luck" :min="1" :max="99" /></n-form-item>
        </n-form>
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
import { ref, onMounted } from 'vue'
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
    if (selectedSetIndex.value !== null) {
      const set = rolledSets.value[selectedSetIndex.value]
      Object.assign(data, set)
    }
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
.roll-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.sets { margin-bottom: 1.5rem; }
.set-row { display: flex; gap: 0.75rem; font-size: 0.9rem; }
.attr-form { background: #f9f9f5; padding: 1rem; border-radius: 8px; }
.actions { display: flex; gap: 1rem; justify-content: flex-end; }
.tip { color: #999; font-size: 0.9rem; }
</style>
