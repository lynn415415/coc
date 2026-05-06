<template>
  <div class="ai-decision-card" :class="`level-${level}`">
    <div class="ai-badge">
      <span class="ai-icon">&#9889;</span>
      <span class="ai-label">{{ levelLabel }}</span>
    </div>
    <div class="decision-content">
      <div class="decision-title">{{ title }}</div>
      <div class="decision-detail">{{ detail }}</div>
    </div>
    <div class="timestamp">{{ formatTime(createdAt) }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: string
  title?: string
  detail: string
  createdAt: string
}>()

const levelLabel = computed(() => {
  switch (props.level) {
    case 'L1': return 'AI自动生成'
    case 'L2': return 'AI自动执行'
    case 'L3': return 'AI建议'
    default: return 'AI'
  }
})

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.ai-decision-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-left: 4px solid;
  background: rgba(255,255,255,0.05);
  border-radius: 0 8px 8px 0;
  margin-bottom: 0.5rem;
}
.ai-decision-card.level-L1 { border-left-color: #8a8a9a; }
.ai-decision-card.level-L2 { border-left-color: #5bc0de; }
.ai-decision-card.level-L3 { border-left-color: #f0a020; }
.ai-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #8a8a9a;
  white-space: nowrap;
  flex-shrink: 0;
}
.ai-icon {
  font-size: 0.9rem;
}
.decision-content {
  flex: 1;
  min-width: 0;
}
.decision-title {
  font-weight: 500;
  font-size: 0.85rem;
  color: #e0e0e0;
  margin-bottom: 0.2rem;
}
.decision-detail {
  font-size: 0.8rem;
  color: #a0a0a0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.timestamp {
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
