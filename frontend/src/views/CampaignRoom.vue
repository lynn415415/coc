<template>
  <div v-if="campaign" class="room">
    <!-- 断线重连提示 -->
    <div v-if="wsReconnecting" class="reconnect-banner">
      <n-spin size="small" /> 正在重新连接...
    </div>
    <!-- 左栏：成员 -->
    <div class="sidebar left">
      <div class="back-bar">
        <n-button text size="small" @click="$router.push(`/campaigns/${route.params.campaignId}`)">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </template>
          返回跑团
        </n-button>
      </div>
      <MemberList
        :members="onlineMembers"
        :is-kp="isKp"
        :kp-id="campaign?.kpId"
        @view-investigator="viewInvestigator"
        @kick="kickMember"
        @approve="approveMember"
      />
    </div>

    <!-- 中栏：场景 + 聊天 -->
    <div class="main">
      <ScenePanel
        v-if="campaign"
        :campaign-id="campaign.id"
        :scenes="campaign.scenes || []"
        :current-scene-id="campaign.currentSceneId"
        :is-kp="isKp"
        @scene-switch="onSceneSwitch"
        @scenes-updated="loadCampaign"
      />
      <div class="chat-wrap">
        <ChatPanel
          :messages="messages"
          :loading-more="loadingMore"
          :mentionables="{ skills: skills, clues: clues }"
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

    <!-- 右栏：快捷面板 / AI-KP / 战斗 -->
    <div class="sidebar right">
      <n-tabs v-model:value="activeTab" type="segment" size="small" animated>
        <n-tab-pane name="quick" tab="快捷">
          <QuickPanel @check="handleQuickCheck" />
        </n-tab-pane>
        <n-tab-pane name="map" tab="地图">
          <SceneMap
            :campaign-id="route.params.campaignId as string"
            :scenes="campaign?.scenes || []"
            :is-kp="isKp"
            :current-scene-id="campaign?.currentSceneId"
          />
        </n-tab-pane>
        <n-tab-pane name="clues" tab="线索">
          <CluePanel
            :campaign-id="route.params.campaignId as string"
            :is-kp="isKp"
            :members="campaign?.members || []"
          />
        </n-tab-pane>
        <n-tab-pane name="ai" tab="AI-KP">
          <AiPanel ref="aiPanelRef" :socket="socket" :campaign-id="route.params.campaignId as string" />
        </n-tab-pane>
        <n-tab-pane name="combat" tab="战斗">
          <CombatTracker :combat="combat" :socket="socket" @start-combat="openCombatDialog" />
        </n-tab-pane>
        <n-tab-pane name="review" tab="复盘">
          <ReviewPanel :campaign-id="route.params.campaignId as string" :is-kp="isKp" />
        </n-tab-pane>
      </n-tabs>
    </div>
    <MacroBar :campaign-id="route.params.campaignId as string" :socket="socket" @check="handleQuickCheck" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { io, Socket } from 'socket.io-client'
import api from '@/api/client'
import MemberList from '@/components/MemberList.vue'
import ScenePanel from '@/components/ScenePanel.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import QuickPanel from '@/components/QuickPanel.vue'
import AiPanel from '@/components/AiPanel.vue'
import CombatTracker from '@/components/CombatTracker.vue'
import SceneMap from '@/components/SceneMap.vue'
import CluePanel from '@/components/CluePanel.vue'
import ReviewPanel from '@/components/ReviewPanel.vue'
import MacroBar from '@/components/MacroBar.vue'

const route = useRoute()
const message = useMessage()

const campaign = ref<any>(null)
const messages = ref<any[]>([])
const onlineMembers = ref<any[]>([])
const loadingMore = ref(false)
const messageCursor = ref<string | undefined>()
const skills = ref<any[]>([])
const clues = ref<any[]>([])

const checkTarget = ref<number | null>(null)
const checkSkillName = ref('')
const bonusDice = ref(0)
const penaltyDice = ref(0)
const aiPanelRef = ref<any>(null)
const combat = ref<any>(null)
const activeTab = ref('quick')
const wsConnected = ref(false)
const wsReconnecting = ref(false)

let socket: Socket | null = null
let lastMessageTime: string | null = null

const isKp = computed(() => campaign.value?.kpId === getUserInfo().userId)

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
  const [campaignRes, skillsRes, cluesRes] = await Promise.all([
    api.get(`/campaigns/${id}`),
    api.get('/skills'),
    api.get(`/campaigns/${id}/clues`),
  ])
  campaign.value = campaignRes.data
  skills.value = skillsRes.data || []
  clues.value = cluesRes.data || []
  // 初始化成员列表（包含KP和待审核）
  const kp = campaignRes.data.kp
  const kpInMembers = campaignRes.data.members.some((m: any) => m.userId === kp.id)
  const allMembers = kpInMembers
    ? campaignRes.data.members
    : [{ userId: kp.id, user: kp, role: 'KP', status: 'APPROVED', investigator: null }, ...campaignRes.data.members]
  onlineMembers.value = allMembers.map((m: any) => ({
    userId: m.userId,
    username: m.user.nickname || m.user.username,
    status: m.status === 'APPROVED' ? 'online' : m.status?.toLowerCase() || 'online',
    role: m.role,
    investigator: m.investigator,
  }))
}

async function loadMessages() {
  const id = route.params.campaignId as string
  const res = await api.get(`/campaigns/${id}/messages`, { params: { limit: 50 } })
  messages.value = res.data || []
  if (messages.value.length) {
    lastMessageTime = messages.value[messages.value.length - 1]?.createdAt
  }
}

async function recoverMessages(campaignId: string) {
  try {
    const res = await api.get(`/campaigns/${campaignId}/messages`, {
      params: { after: lastMessageTime, limit: 100 },
    })
    const missed = res.data || []
    const existingIds = new Set(messages.value.map((m: any) => m.id))
    for (const msg of missed) {
      if (!existingIds.has(msg.id)) {
        messages.value.push(msg)
      }
    }
    if (missed.length) {
      lastMessageTime = missed[missed.length - 1]?.createdAt
    }
  } catch { /* ignore recovery errors */ }
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
  const token = localStorage.getItem('token')
  if (!token) return

  socket = io('/campaign', {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect', () => {
    wsConnected.value = true
    wsReconnecting.value = false
    socket?.emit('join_campaign', { campaignId })
    // 断线重连后恢复丢失的消息
    if (lastMessageTime) {
      recoverMessages(campaignId)
    }
  })

  socket.on('disconnect', () => {
    wsConnected.value = false
    wsReconnecting.value = true
  })

  socket.io.on('reconnect_attempt', () => {
    wsReconnecting.value = true
  })

  socket.io.on('reconnect_failed', () => {
    wsReconnecting.value = false
    message.error('无法连接到服务器，请刷新页面重试')
  })

  socket.on('new_message', (msg: any) => {
    messages.value.push(msg)
    lastMessageTime = msg.createdAt
    if (msg.senderType === 'AI' && aiPanelRef.value) {
      aiPanelRef.value.onAiDecision(msg)
    }
  })

  socket.on('ai_stream', (data: any) => {
    const msg = messages.value.find((m) => m.id === data.messageId)
    if (msg) {
      msg.content += data.chunk
      msg._typing = !data.done
    }
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
      onlineMembers.value.push({ ...data, status: 'online' })
    } else {
      const m = onlineMembers.value.find(m => m.userId === data.userId)
      if (m) m.status = 'online'
    }
  })

  socket.on('user_left', (data: any) => {
    onlineMembers.value = onlineMembers.value.filter((m) => m.userId !== data.userId)
  })

  socket.on('presence_update', (data: any) => {
    const member = onlineMembers.value.find(m => m.userId === data.userId)
    if (member) {
      member.status = data.status
    }
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

  socket.on('combat_updated', (data: any) => {
    combat.value = data
    if (data) activeTab.value = 'combat'
  })

  socket.on('combat_ended', () => {
    combat.value = null
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

function onSceneSwitch(sceneId: string) {
  if (campaign.value) {
    campaign.value.currentSceneId = sceneId
  }
}

function viewInvestigator(id: string) {
  // TODO: 打开角色卡详情弹窗
  window.open(`/investigators/${id}`, '_blank')
}

async function kickMember(targetUserId: string) {
  if (!campaign.value) return
  try {
    await api.post(`/campaigns/${campaign.value.id}/members/${targetUserId}/kick`)
    onlineMembers.value = onlineMembers.value.filter(m => m.userId !== targetUserId)
    message.success('已移除该成员')
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

async function approveMember(targetUserId: string) {
  if (!campaign.value) return
  try {
    await api.post(`/campaigns/${campaign.value.id}/members/${targetUserId}/approve`)
    const member = onlineMembers.value.find(m => m.userId === targetUserId)
    if (member) member.status = 'APPROVED'
    message.success('已通过审核')
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
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

function openCombatDialog() {
  const members = campaign.value?.members?.filter((m: any) => m.status === 'APPROVED') || []
  const investigatorIds = members
    .filter((m: any) => m.investigatorId)
    .map((m: any) => m.investigatorId)

  if (investigatorIds.length === 0) {
    message.warning('没有可加入战斗的角色卡')
    return
  }

  socket?.emit('combat_start', { investigatorIds }, (res: any) => {
    if (res?.error) message.error(res.error)
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
.back-bar { padding: 0.5rem; border-bottom: 1px solid #2a2a3e; }
.sidebar { width: 220px; background: #1e1e32; border-right: 1px solid #2a2a3e; overflow-y: auto; color: #c0c0c8; }
.sidebar.right { width: 280px; border-right: none; border-left: 1px solid #2a2a3e; background: #1a1a2e; overflow: hidden; display: flex; flex-direction: column; }
.sidebar.right :deep(.n-tabs) { flex: 1; display: flex; flex-direction: column; }
.sidebar.right :deep(.n-tabs-tab-pane) { height: 100%; overflow: hidden; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.chat-wrap { flex: 1; min-height: 0; }
.dice-bar { padding: 0.5rem 1rem; border-top: 1px solid #2a2a3e; background: #1e1e32; }
.quick-placeholder { padding: 1rem; }
.quick-placeholder h4 { margin-bottom: 1rem; font-size: 0.9rem; }
.reconnect-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  background: #f5a623; color: #1a1a2e; padding: 0.4rem 1rem;
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8rem; font-weight: 600; justify-content: center;
}
</style>
