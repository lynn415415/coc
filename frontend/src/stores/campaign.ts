import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import type { Campaign, CampaignMember, Message } from '@/types/campaign'

export const useCampaignStore = defineStore('campaign', () => {
  const campaign = ref<Campaign | null>(null)
  const messages = ref<Message[]>([])
  const onlineMembers = ref<CampaignMember[]>([])
  const loadingMore = ref(false)
  const messageCursor = ref<string | undefined>()
  const lastMessageTime = ref<string | null>(null)
  const wsConnected = ref(false)
  const wsReconnecting = ref(false)

  const currentSceneId = computed(() => campaign.value?.currentSceneId || null)
  const scenes = computed(() => campaign.value?.scenes || [])
  const currentScene = computed(() => {
    if (!currentSceneId.value) return null
    return scenes.value.find((s) => s.id === currentSceneId.value) || null
  })
  const members = computed(() => campaign.value?.members || [])

  async function loadCampaign(id: string) {
    const res = await api.get(`/campaigns/${id}`)
    campaign.value = res.data
    onlineMembers.value = res.data.members
      .filter((m: any) => m.status === 'APPROVED')
      .map((m: any) => ({
        userId: m.userId,
        username: m.user?.nickname || m.user?.username,
        investigator: m.investigator,
        status: 'online',
      }))
  }

  async function loadMessages(id: string) {
    const res = await api.get(`/campaigns/${id}/messages`, { params: { limit: 50 } })
    messages.value = res.data || []
    if (messages.value.length) {
      lastMessageTime.value = messages.value[messages.value.length - 1]?.createdAt
    }
  }

  async function loadMoreMessages(id: string) {
    if (loadingMore.value || !messageCursor.value) return
    loadingMore.value = true
    try {
      const res = await api.get(`/campaigns/${id}/messages`, {
        params: { cursor: messageCursor.value, limit: 50 },
      })
      const older = res.data || []
      if (older.length) {
        messages.value.unshift(...older)
        messageCursor.value = older[0]?.id
      }
    } finally {
      loadingMore.value = false
    }
  }

  async function recoverMessages(id: string) {
    if (!lastMessageTime.value) return
    try {
      const res = await api.get(`/campaigns/${id}/messages`, {
        params: { after: lastMessageTime.value, limit: 100 },
      })
      const missed = res.data || []
      const existingIds = new Set(messages.value.map((m) => m.id))
      for (const msg of missed) {
        if (!existingIds.has(msg.id)) messages.value.push(msg)
      }
      if (missed.length) lastMessageTime.value = missed[missed.length - 1]?.createdAt
    } catch { /* ignore */ }
  }

  function addMessage(msg: Message) {
    messages.value.push(msg)
    lastMessageTime.value = msg.createdAt
  }

  function updateScene(sceneId: string) {
    if (campaign.value) campaign.value.currentSceneId = sceneId
  }

  function reset() {
    campaign.value = null
    messages.value = []
    onlineMembers.value = []
    lastMessageTime.value = null
  }

  return {
    campaign, messages, onlineMembers, loadingMore, messageCursor,
    lastMessageTime, wsConnected, wsReconnecting,
    currentSceneId, scenes, currentScene, members,
    loadCampaign, loadMessages, loadMoreMessages, recoverMessages,
    addMessage, updateScene, reset,
  }
})
