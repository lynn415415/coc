<template>
  <div class="action-input">
    <n-select v-model:value="actionType" :options="actionOptions" size="small" style="width: 100px" />
    <n-input v-model:value="description" size="small" placeholder="描述你的行动..." @keyup.enter="submit" />
    <n-button size="small" type="primary" :disabled="!description.trim()" @click="submit">行动</n-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'action', payload: { actionType: string; description: string }): void
}>()

const actionType = ref('CUSTOM')
const description = ref('')

const actionOptions = [
  { label: '调查', value: 'INVESTIGATE' },
  { label: '移动', value: 'MOVE' },
  { label: '攻击', value: 'ATTACK' },
  { label: '交谈', value: 'TALK' },
  { label: '使用物品', value: 'USE_ITEM' },
  { label: '施法', value: 'CAST' },
  { label: '其他', value: 'CUSTOM' },
]

function submit() {
  const text = description.value.trim()
  if (!text) return
  emit('action', { actionType: actionType.value, description: text })
  description.value = ''
}
</script>

<style scoped>
.action-input { display: flex; gap: 0.5rem; padding: 0.5rem 1rem; border-top: 1px solid #e8e8e3; background: #fff; }
.action-input .n-input { flex: 1; }
</style>
