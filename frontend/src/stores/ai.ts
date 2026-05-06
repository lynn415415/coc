import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'

export interface AiDecisionLog {
  id: string
  level: string
  action: string
  createdAt: string
}

export const useAiStore = defineStore('ai', () => {
  const enabled = ref(true)
  const decisionLog = ref<AiDecisionLog[]>([])
  const pendingApprovals = ref<any[]>([])
  const pendingCount = computed(() => pendingApprovals.value.length)

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

  async function loadDecisionLog(campaignId: string) {
    try {
      const res = await api.get(`/ai/${campaignId}/decision-log`)
      decisionLog.value = res.data || []
    } catch {
      // fallback to localStorage
      try {
        const raw = localStorage.getItem(`ai-decision-log-${campaignId}`)
        if (raw) decisionLog.value = JSON.parse(raw)
      } catch { /* ignore */ }
    }
  }

  async function addLog(campaignId: string, level: string, action: string) {
    const entry: AiDecisionLog = {
      id: `log-${Date.now()}`,
      level,
      action,
      createdAt: new Date().toISOString(),
    }
    decisionLog.value.unshift(entry)
    if (decisionLog.value.length > 20) decisionLog.value = decisionLog.value.slice(0, 20)

    try {
      await api.post(`/ai/${campaignId}/decision-log`, entry)
    } catch {
      // fallback: persist to localStorage
      try {
        localStorage.setItem(`ai-decision-log-${campaignId}`, JSON.stringify(decisionLog.value.slice(0, 50)))
      } catch { /* ignore */ }
    }
  }

  function onAiDecision(campaignId: string, data: any) {
    const level = data.metadata?.level || 'L1'
    const action = data.metadata?.action || 'AI生成'
    addLog(campaignId, level, action)
  }

  function reset() {
    enabled.value = true
    decisionLog.value = []
    pendingApprovals.value = []
  }

  return {
    enabled, decisionLog, pendingApprovals, pendingCount,
    l1Rules, l2Rules,
    loadDecisionLog, addLog, onAiDecision, reset,
  }
})
