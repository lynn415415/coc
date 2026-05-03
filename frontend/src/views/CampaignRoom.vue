<template>
  <div v-if="campaign" class="room">
    <!-- 左栏：成员 -->
    <div class="sidebar left">
      <MemberList :members="onlineMembers" />
    </div>

    <!-- 中栏：场景 + 聊天 -->
    <div class="main">
      <div v-if="currentScene" class="scene-banner">
        <h3>{{ currentScene.name }}</h3>
        <p>{{ currentScene.description }}</p>
      </div>
      <div class="chat-wrap">
        <ChatPanel
          :messages="messages"
          :loading-more="loadingMore"
          @send="handleSend"
          @load-more="loadMoreMessages"
        />
      </div>
      <div class="dice-bar">
        <n-space align="center" size="small">
          <n-input-number v-model:value="checkTarget" :min="1" :max="99" placeholder="目标值" style="width: 80px" />
          <n-input v-model:value="checkSkillName" placeholder="技能名" style="width: 100px" />
          <n-input-number v-model:value="bonusDice" :min="0" :max="3" placeholder="奖励" style="width: 70px" />
          <n-input-number v-model:value="penaltyDice" :min="0" :max="3" placeholder="惩罚" style="width: 70px" />
          <n-button size="small" type="primary" :disabled="!checkTarget" @click="requestCheck">
            检定
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 右栏：快速面板 -->
    <div class="sidebar right">
      <QuickPanel @check="handleQuickCheck" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { io, Socket } from 'socket.io-client'
import api from '@/api/client'
import MemberList from '@/components/MemberList.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import QuickPanel from '@/components/QuickPanel.vue'

const route = useRoute()
const message = useMessage()

const campaign = ref<any>(null)
const messages = ref<any[]>([])
const onlineMembers = ref<any[]>([])
const loadingMore = ref(false)
const messageCursor = ref<string | undefined>()

const checkTarget = ref<number | null>(null)
const checkSkillName = ref('')
const bonusDice = ref(0)
const penaltyDice = ref(0)

let socket: Socket | null = null

const currentScene = computed(() => {
  if (!campaign.value?.currentSceneId) return null
  return campaign.value.scenes.find((s: any) => s.id === campaign.value.currentSceneId)
})

function getUserInfo() {
  try {
    const token = localStorage.getItem('token') || ''
    if (!token) return { userId: '', username: '' }
    const p = JSON.parse(atob(token.split('.')[1]))
    return { userId: p.sub || '', username: p.nickname || p.username || '匿名' }
  } catch { return { userId: '', username: '' } }
}

async function loadCampaign() {
  const id = route.params.campaignId as string
  const res = await api.get(`/campaigns/${id}`)
  campaign.value = res.data
  // 初始化在线成员列表
  onlineMembers.value = res.data.members
    .filter((m: any) => m.status === 'APPROVED')
    .map((m: any) => ({
      userId: m.userId,
      username: m.user.nickname || m.user.username,
      investigator: m.investigator,
    }))
}

async function loadMessages() {
  const id = route.params.campaignId as string
  const res = await api.get(`/campaigns/${id}/messages`, { params: { limit: 50 } })
  messages.value = res.data || []
}

async function loadMoreMessages() {
  if (loadingMore.value || !messageCursor.value) return
  loadingMore.value = true
  try {
    const id = route.params.campaignId as string
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

function connectSocket() {
  const campaignId = route.params.campaignId as string
  const { userId, username } = getUserInfo()
  if (!userId) return

  socket = io('/campaign', {
    transports: ['websocket'],
    query: { userId, username },
  })

  socket.on('connect', () => {
    socket?.emit('join_campaign', { campaignId })
  })

  socket.on('new_message', (msg: any) => {
    messages.value.push(msg)
  })

  socket.on('check_result', (result: any) => {
    messages.value.push({
      id: result.id,
      senderName: result.senderName || '系统',
      senderType: 'SYSTEM',
      content: `${result.skillName || '检定'}: ${result.rollResult}/${result.targetValue} ${result.description || ''}`,
      messageType: 'CHECK',
      metadata: result,
      createdAt: result.createdAt || new Date().toISOString(),
    })
  })

  socket.on('user_joined', (data: any) => {
    if (!onlineMembers.value.find((m) => m.userId === data.userId)) {
      onlineMembers.value.push(data)
    }
  })

  socket.on('user_left', (data: any) => {
    onlineMembers.value = onlineMembers.value.filter((m) => m.userId !== data.userId)
  })

  socket.on('scene_changed', (data: any) => {
    if (campaign.value) {
      campaign.value.currentSceneId = data.sceneId
    }
    messages.value.push({
      id: `scene-${Date.now()}`,
      senderName: '系统',
      senderType: 'SYSTEM',
      content: `场景切换至：${data.sceneName || '新场景'}`,
      messageType: 'SYSTEM',
      createdAt: new Date().toISOString(),
    })
  })
}

function handleSend(content: string) {
  if (!socket?.connected) {
    message.error('未连接到房间')
    return
  }
  socket.emit('send_message', { content, messageType: 'TEXT' })
}

function requestCheck() {
  if (!socket?.connected) {
    message.error('未连接到房间')
    return
  }
  if (!checkTarget.value) {
    message.error('请输入目标值')
    return
  }
  const { userId } = getUserInfo()
  const myMember = campaign.value?.members.find((m: any) => m.userId === userId)
  socket.emit('request_check', {
    targetValue: checkTarget.value,
    skillName: checkSkillName.value || '技能检定',
    bonusDice: bonusDice.value,
    penaltyDice: penaltyDice.value,
    investigatorId: myMember?.investigatorId,
  })
}

function handleQuickCheck(payload: { targetValue: number; skillName: string }) {
  if (!socket?.connected) {
    message.error('未连接到房间')
    return
  }
  const { userId } = getUserInfo()
  const myMember = campaign.value?.members.find((m: any) => m.userId === userId)
  socket.emit('request_check', {
    targetValue: payload.targetValue,
    skillName: payload.skillName,
    bonusDice: 0,
    penaltyDice: 0,
    investigatorId: myMember?.investigatorId,
  })
}

onMounted(async () => {
  await loadCampaign()
  await loadMessages()
  connectSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.emit('leave_campaign')
    socket.disconnect()
  }
})
</script>

<style scoped>
.room { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 220px; background: #f5f5f0; border-right: 1px solid #e0e0dc; overflow-y: auto; }
.sidebar.right { border-right: none; border-left: 1px solid #e0e0dc; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.scene-banner { background: #2c2c2c; color: #fff; padding: 0.75rem 1rem; }
.scene-banner h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.scene-banner p { margin: 0; font-size: 0.8rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-wrap { flex: 1; min-height: 0; }
.dice-bar { padding: 0.5rem 1rem; border-top: 1px solid #e8e8e3; background: #fff; }
.quick-placeholder { padding: 1rem; }
.quick-placeholder h4 { margin-bottom: 1rem; font-size: 0.9rem; }
</style>
