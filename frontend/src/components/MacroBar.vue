<template>
  <div class="macro-bar">
    <div
      v-for="(slot, i) in slots"
      :key="i"
      class="macro-slot"
      :class="{ empty: !slot, active: activeIndex === i }"
      @click="executeSlot(i)"
      @contextmenu.prevent="clearSlot(i)"
    >
      <template v-if="slot">
        <span class="macro-icon">{{ slotIcon(slot) }}</span>
        <span class="macro-label">{{ slot.customLabel || slotLabel(slot) }}</span>
      </template>
      <template v-else>
        <span class="macro-placeholder">{{ i + 1 }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'

const props = defineProps<{
  campaignId: string
  socket?: any
}>()

const emit = defineEmits<{
  check: [payload: { targetValue: number; skillName: string }]
}>()

interface MacroSlot {
  id?: string
  slotIndex: number
  slotType: 'SKILL' | 'CHECK_MACRO' | 'ACTION_MACRO'
  targetId?: string
  customLabel?: string
  customValue?: string
}

const slots = ref<(MacroSlot | null)[]>(Array(10).fill(null))
const activeIndex = ref(-1)

function slotLabel(slot: MacroSlot): string {
  if (slot.slotType === 'SKILL') return slot.targetId || '技能'
  if (slot.slotType === 'CHECK_MACRO') return slot.customValue || '检定'
  return '动作'
}

function slotIcon(slot: MacroSlot): string {
  if (slot.slotType === 'SKILL') return '🎯'
  if (slot.slotType === 'CHECK_MACRO') return '🎲'
  return '⚡'
}

function executeSlot(i: number) {
  const slot = slots.value[i]
  if (!slot) return
  activeIndex.value = i
  setTimeout(() => { activeIndex.value = -1 }, 300)

  if (slot.slotType === 'CHECK_MACRO' && slot.customValue) {
    const [targetStr, name] = slot.customValue.split('|')
    const targetValue = parseInt(targetStr)
    if (targetValue) {
      emit('check', { targetValue, skillName: name || '快捷检定' })
    }
  } else if (slot.slotType === 'SKILL' && slot.customValue) {
    const [targetStr, name] = slot.customValue.split('|')
    const targetValue = parseInt(targetStr)
    if (targetValue) {
      emit('check', { targetValue, skillName: name || slot.targetId || '技能' })
    }
  }
}

function clearSlot(i: number) {
  slots.value[i] = null
}

async function loadSlots() {
  try {
    const res = await api.get(`/quick-panel/${props.campaignId}`)
    const data = res.data?.slots || []
    for (const s of data) {
      if (s.slotIndex >= 0 && s.slotIndex < 10) {
        slots.value[s.slotIndex] = s
      }
    }
  } catch { /* ignore */ }
}

onMounted(loadSlots)
</script>

<style scoped>
.macro-bar {
  display: flex;
  height: 48px;
  background: #1a1a2e;
  border-top: 1px solid #2a2a3e;
  padding: 4px 8px;
  gap: 4px;
  align-items: center;
}
.macro-slot {
  flex: 1;
  max-width: 48px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: rgba(255,255,255,0.05);
  border: 1px solid transparent;
}
.macro-slot:hover {
  background: rgba(255,255,255,0.1);
  border-color: #4a4a6e;
}
.macro-slot.empty {
  opacity: 0.3;
}
.macro-slot.active {
  background: rgba(100,140,255,0.2);
  border-color: #648cff;
  transform: scale(0.95);
}
.macro-icon {
  font-size: 14px;
  line-height: 1;
}
.macro-label {
  font-size: 8px;
  color: #8a8a9a;
  line-height: 1;
  margin-top: 2px;
  max-width: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.macro-placeholder {
  font-size: 12px;
  color: #444;
  font-family: monospace;
}
</style>
