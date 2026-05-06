<template>
  <div class="ai-panel">
    <div class="panel-header">
      <span class="header-icon">&#129302;</span>
      <span class="header-title">AI-KP</span>
      <n-switch v-model:value="enabled" size="small" />
    </div>

    <div class="panel-body">
      <!-- 快捷操作 -->
      <div class="section">
        <div class="section-title">快捷生成</div>
        <n-space vertical size="small">
          <n-input
            v-model:value="scenePrompt"
            type="textarea"
            placeholder="输入场景上下文，按Enter生成描述"
            :autosize="{ minRows: 2, maxRows: 4 }"
            size="small"
            @keydown.enter.prevent="generateScene"
          />
          <n-button size="tiny" type="primary" :loading="loadingScene" :disabled="!scenePrompt.trim()" @click="generateScene">
            生成场景描述
          </n-button>

          <n-input
            v-model:value="npcPrompt"
            placeholder="输入NPC设定和玩家对话"
            size="small"
            @keydown.enter.prevent="generateNpc"
          />
          <n-button size="tiny" type="info" :loading="loadingNpc" :disabled="!npcPrompt.trim()" @click="generateNpc">
            生成NPC回复
          </n-button>
        </n-space>
      </div>

      <!-- 规则开关 -->
      <div class="section">
        <div class="section-title">自动化层级</div>
        <div class="rule-group">
          <div class="rule-label">L1 全自动</div>
          <n-space size="small">
            <n-checkbox v-model:checked="l1Rules.sceneDescription" size="small">场景描述</n-checkbox>
            <n-checkbox v-model:checked="l1Rules.npcDialogue" size="small">NPC对话</n-checkbox>
            <n-checkbox v-model:checked="l1Rules.checkFormat" size="small">检定文本</n-checkbox>
          </n-space>
        </div>
        <div class="rule-group">
          <div class="rule-label">L2 半自动</div>
          <n-space size="small">
            <n-checkbox v-model:checked="l2Rules.autoCheck" size="small">检定判定</n-checkbox>
            <n-checkbox v-model:checked="l2Rules.autoValue" size="small">数值变化</n-checkbox>
          </n-space>
        </div>
      </div>

      <!-- 决策日志 -->
      <div class="section">
        <div class="section-title">AI决策日志</div>
        <div v-if="decisionLog.length === 0" class="empty-log">暂无记录</div>
        <div v-else class="log-list">
          <div
            v-for="log in decisionLog.slice(0, 8)"
            :key="log.id"
            class="log-item"
            :class="`log-${log.level}`"
          >
            <span class="log-time">{{ formatTime(log.createdAt) }}</span>
            <span class="log-badge">{{ log.level }}</span>
            <span class="log-action">{{ log.action }}</span>
          </div>
        </div>
      </div>

      <!-- 待审核（最简版占位） -->
      <div class="section">
        <div class="section-title">
          待审核
          <n-badge v-if="pendingCount > 0" :value="pendingCount" />
        </div>
        <div v-if="pendingApprovals.length === 0" class="empty-pending">暂无待审核建议</div>
        <div v-else class="pending-list">
          <!-- L3建议卡片 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  socket?: any
  campaignId?: string
}>()


const enabled = ref(true)
const scenePrompt = ref('')
const npcPrompt = ref('')
const loadingScene = ref(false)
const loadingNpc = ref(false)

const l1Rules = ref({
  sceneDescription: true,
  npcDialogue: true,
  checkFormat: true,
  atmosphere: false,
})

const l2Rules = ref({
  autoCheck: false,
  autoValue: false,
  itemConsume: false,
  initiative: false,
})

const STORAGE_KEY = `ai-decision-log-${props.campaignId || 'global'}`
const decisionLog = ref<any[]>([])
const pendingApprovals = ref<any[]>([])
const pendingCount = computed(() => pendingApprovals.value.length)

// 持久化决策日志
function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) decisionLog.value = JSON.parse(raw)
  } catch { /* ignore */ }
}
function saveLog() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisionLog.value.slice(0, 50)))
  } catch { /* ignore */ }
}
watch(decisionLog, saveLog, { deep: true })
onMounted(loadLog)

function generateScene() {
  if (!props.socket || !scenePrompt.value.trim()) return
  loadingScene.value = true
  props.socket.emit('ai_generate', { prompt: scenePrompt.value, type: 'scene' }, (res: any) => {
    loadingScene.value = false
    if (res.success) {
      addLog('L1', '场景描述')
      scenePrompt.value = ''
    }
  })
}

function generateNpc() {
  if (!props.socket || !npcPrompt.value.trim()) return
  loadingNpc.value = true
  props.socket.emit('ai_generate', { prompt: npcPrompt.value, type: 'npc' }, (res: any) => {
    loadingNpc.value = false
    if (res.success) {
      addLog('L1', 'NPC对话')
      npcPrompt.value = ''
    }
  })
}

function addLog(level: string, action: string) {
  decisionLog.value.unshift({
    id: `log-${Date.now()}`,
    level,
    action,
    createdAt: new Date().toISOString(),
  })
  if (decisionLog.value.length > 20) {
    decisionLog.value = decisionLog.value.slice(0, 20)
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// 暴露方法供父组件调用
function onAiDecision(data: any) {
  const level = data.metadata?.level || 'L1'
  const action = data.metadata?.action || 'AI生成'
  addLog(level, action)
}

defineExpose({ onAiDecision })
</script>

<style scoped>
.ai-panel {
  width: 260px;
  background: #1a1a2e;
  border-left: 1px solid #2a2a3e;
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #c0c0c8;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid #2a2a3e;
  font-weight: 600;
  font-size: 0.9rem;
}
.header-icon {
  font-size: 1rem;
}
.header-title {
  flex: 1;
  color: #e0e0e8;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}
.section {
  margin-bottom: 1rem;
}
.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8a8a9a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.rule-group {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
}
.rule-label {
  font-size: 0.75rem;
  color: #a0a0a8;
  margin-bottom: 0.25rem;
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.log-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
  background: rgba(255,255,255,0.02);
}
.log-time {
  color: #666;
  font-family: monospace;
  font-size: 0.7rem;
}
.log-badge {
  padding: 0 0.3rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  background: #3a3a4e;
  color: #c0c0c8;
}
.log-L1 .log-badge { background: #4a4a5a; color: #c0c0c8; }
.log-L2 .log-badge { background: #1a4a5a; color: #5bc0de; }
.log-L3 .log-badge { background: #4a3a1a; color: #f0a020; }
.log-action {
  color: #a0a0a8;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-log,
.empty-pending {
  font-size: 0.8rem;
  color: #555;
  text-align: center;
  padding: 0.5rem 0;
}
</style>
