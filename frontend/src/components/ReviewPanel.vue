<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

interface TimelineEvent {
  id: string
  title: string
  content: string
  senderName: string
  senderType: string
  eventType: string
  eventTime: string
  realTime: string
  messageType: string
}

const props = defineProps<{
  campaignId: string
  isKp: boolean
}>()

const message = useMessage()
const events = ref<TimelineEvent[]>([])
const loading = ref(false)
const timeAxis = ref<'script' | 'real'>('real')

const sortedEvents = computed(() => {
  const list = [...events.value]
  const key = timeAxis.value === 'script' ? 'eventTime' : 'realTime'
  return list.sort((a, b) => new Date(a[key]).getTime() - new Date(b[key]).getTime())
})

const eventTypeColor: Record<string, string> = {
  战斗: '#e74c3c',
  线索: '#f39c12',
  场景: '#3498db',
  对话: '#2ecc71',
  通用: '#95a5a6',
}

async function loadTimeline() {
  loading.value = true
  try {
    const res = await api.get(`/campaigns/${props.campaignId}/messages/timeline`)
    events.value = res.data
  } catch (e: any) {
    message.error(e.response?.data?.message || '加载时间线失败')
  } finally {
    loading.value = false
  }
}

async function exportMarkdown() {
  try {
    const lines = [
      `# 战役复盘报告`,
      ``,
      `生成时间：${new Date().toLocaleString()}`,
      ``,
      `## 事件时间线（${timeAxis.value === 'script' ? '剧本时间' : '现实时间'}）`,
      ``,
    ]

    sortedEvents.value.forEach((ev, idx) => {
      const time = timeAxis.value === 'script' ? ev.eventTime : ev.realTime
      lines.push(`### ${idx + 1}. ${ev.title}`)
      lines.push(`- **类型**：${ev.eventType}`)
      lines.push(`- **时间**：${new Date(time).toLocaleString()}`)
      lines.push(`- **来源**：${ev.senderName}`)
      lines.push(`- **内容**：${ev.content}`)
      lines.push(``)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `复盘_${props.campaignId}_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch {
    message.error('导出失败')
  }
}

function printReview() {
  window.print()
}

onMounted(loadTimeline)
watch(() => props.campaignId, loadTimeline)
</script>

<template>
  <div class="review-panel">
    <div class="review-header">
      <n-space align="center">
        <span class="review-title">📜 复盘时间线</span>
        <n-radio-group v-model:value="timeAxis" size="small">
          <n-radio-button value="real">现实时间</n-radio-button>
          <n-radio-button value="script">剧本时间</n-radio-button>
        </n-radio-group>
        <n-button size="small" @click="exportMarkdown">导出 Markdown</n-button>
        <n-button size="small" @click="printReview">🖨️ 打印</n-button>
      </n-space>
    </div>

    <n-spin :show="loading">
      <div v-if="sortedEvents.length === 0" class="review-empty">
        暂无事件记录。KP 可在聊天区右键消息标记为事件。
      </div>

      <div v-else class="review-timeline">
        <div
          v-for="(ev, idx) in sortedEvents"
          :key="ev.id"
          class="review-event"
        >
          <div class="review-event-marker">
            <div class="review-event-dot" :style="{ background: eventTypeColor[ev.eventType] || eventTypeColor['通用'] }" />
            <div v-if="idx < sortedEvents.length - 1" class="review-event-line" />
          </div>

          <div class="review-event-content">
            <div class="review-event-header">
              <span class="review-event-title">{{ ev.title }}</span>
              <n-tag size="tiny" :color="{ color: eventTypeColor[ev.eventType] || eventTypeColor['通用'], textColor: '#fff' }">
                {{ ev.eventType }}
              </n-tag>
            </div>
            <div class="review-event-meta">
              {{ ev.senderName }} · {{ new Date(timeAxis === 'script' ? ev.eventTime : ev.realTime).toLocaleString() }}
            </div>
            <div class="review-event-body">{{ ev.content }}</div>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
.review-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.review-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.review-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.review-empty {
  text-align: center;
  color: #666;
  padding: 40px 0;
  font-size: 14px;
}

.review-timeline {
  flex: 1;
  overflow-y: auto;
}

.review-event {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.review-event-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}

.review-event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.review-event-line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 4px;
}

.review-event-content {
  flex: 1;
  padding-bottom: 12px;
}

.review-event-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.review-event-title {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.review-event-meta {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.review-event-body {
  font-size: 13px;
  color: #a0a0a0;
  line-height: 1.5;
  word-break: break-word;
}

@media print {
  .review-header { display: none !important; }
  .review-panel { padding: 0; }
  .review-event-dot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .review-event-line { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .review-event-title { color: #333 !important; }
  .review-event-meta { color: #666 !important; }
  .review-event-body { color: #555 !important; }
}
</style>
