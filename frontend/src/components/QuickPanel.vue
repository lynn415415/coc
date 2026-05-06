<template>
  <div class="quick-panel">
    <h4>快速面板</h4>
    <div class="slot-grid">
      <div v-for="i in 8" :key="i" class="slot" @click="triggerSlot(i - 1)">
        <div v-if="slots[i - 1]" class="slot-content">
          <div class="slot-label">{{ slots[i - 1].customLabel || slots[i - 1].slotType }}</div>
        </div>
        <div v-else class="slot-empty">+</div>
      </div>
    </div>
    <n-button size="tiny" block @click="showConfig = true">配置</n-button>

    <n-modal v-model:show="showConfig" title="配置快捷面板" preset="card" style="width: 420px">
      <n-form>
        <div v-for="i in 8" :key="i" class="config-row">
          <span class="config-index">{{ i }}</span>
          <n-select v-model:value="configForms[i - 1].slotType" :options="slotTypeOptions" size="small" style="width: 100px" />
          <n-input v-model:value="configForms[i - 1].customLabel" size="small" placeholder="标签" style="width: 120px" />
          <n-input v-model:value="configForms[i - 1].targetId" size="small" placeholder="目标ID" style="width: 100px" />
        </div>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showConfig = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="saveConfig">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const route = useRoute()
const message = useMessage()
const emit = defineEmits<{
  (e: 'check', payload: { targetValue: number; skillName: string }): void
}>()

const slots = ref<any[]>([])
const showConfig = ref(false)
const saving = ref(false)
const configForms = ref(Array.from({ length: 8 }, () => ({ slotType: '', customLabel: '', targetId: '', customValue: '' })))

const slotTypeOptions = [
  { label: '空', value: '' },
  { label: '技能', value: 'SKILL' },
  { label: '物品', value: 'ITEM' },
  { label: '检定宏', value: 'CHECK_MACRO' },
  { label: '行动宏', value: 'ACTION_MACRO' },
]

async function load() {
  const campaignId = route.params.campaignId as string
  const res = await api.get(`/campaigns/${campaignId}/quick-panel`)
  const data = res.data || []
  const filled = Array.from({ length: 8 }, (_, i) => data.find((s: any) => s.slotIndex === i) || null)
  slots.value = filled
  filled.forEach((s: any, i: number) => {
    if (s) {
      configForms.value[i] = { slotType: s.slotType, customLabel: s.customLabel || '', targetId: s.targetId || '', customValue: s.customValue || '' }
    }
  })
}

async function saveConfig() {
  const campaignId = route.params.campaignId as string
  const payload = configForms.value
    .map((f, i) => ({ slotIndex: i, slotType: f.slotType || undefined, customLabel: f.customLabel || undefined, targetId: f.targetId || undefined, customValue: f.customValue || undefined }))
    .filter(f => f.slotType)
  saving.value = true
  try {
    await api.post(`/campaigns/${campaignId}/quick-panel`, { slots: payload })
    message.success('保存成功')
    showConfig.value = false
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function triggerSlot(index: number) {
  const slot = slots.value[index]
  if (!slot) return
  if (slot.slotType === 'SKILL' || slot.slotType === 'CHECK_MACRO') {
    const val = parseInt(slot.customValue || '0')
    if (val > 0) {
      emit('check', { targetValue: val, skillName: slot.customLabel || '技能' })
    }
  }
}

onMounted(load)
</script>

<style scoped>
.quick-panel { padding: 0.75rem; color: #c0c0c8; }
h4 { margin-bottom: 0.75rem; font-size: 0.9rem; color: #e0e0e8; }
.slot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; }
.slot { height: 56px; border: 1px dashed #4a4a5a; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; background: #222233; }
.slot:hover { border-color: #c49a6c; background: #2a2a3e; }
.slot-empty { color: #666; font-size: 1.2rem; }
.slot-content { text-align: center; }
.slot-label { font-size: 0.75rem; color: #e0e0e8; }
.config-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.config-index { width: 16px; font-size: 0.8rem; color: #888; }
</style>
