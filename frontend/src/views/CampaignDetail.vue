<template>
  <div v-if="campaign" class="page">
    <div class="back-bar">
      <n-button text @click="$router.push('/campaigns')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回跑团列表
      </n-button>
    </div>

    <div class="header">
      <div>
        <h2>{{ campaign.title }}</h2>
        <div class="meta">
          <n-tag :type="statusType(campaign.status)">{{ statusText(campaign.status) }}</n-tag>
          <n-tag v-if="campaign.era">{{ eraText(campaign.era) }}</n-tag>
          <span>KP: {{ campaign.kp.nickname || campaign.kp.username }}</span>
          <span>{{ campaign.members.length }}/{{ campaign.maxPlayers }} 人</span>
        </div>
      </div>
      <n-space>
        <n-button v-if="isKp && campaign.status === 'RECRUITING'" type="primary" @click="startCampaign">开始跑团</n-button>
        <n-button v-if="isKp && campaign.status === 'ONGOING'" @click="endCampaign">结束跑团</n-button>
        <n-button v-if="campaign.status === 'ONGOING' && isMySelf" type="primary" @click="enterRoom">进入房间</n-button>
        <n-button v-if="!isMySelf && campaign.status === 'RECRUITING'" type="primary" @click="joinCampaign">申请加入</n-button>
      </n-space>
    </div>

    <n-tabs type="line">
      <n-tab-pane name="overview" tab="概览">
        <p class="desc">{{ campaign.description || '暂无描述' }}</p>
        <div v-if="campaign.status === 'ONGOING' && currentScene" class="scene-box">
          <h4>当前场景: {{ currentScene.name }}</h4>
          <p>{{ currentScene.description || '暂无场景描述' }}</p>
        </div>
      </n-tab-pane>

      <!-- 成员 Tab ==== -->
      <n-tab-pane name="members" tab="成员">
        <div class="members-panel">
          <!-- KP -->
          <div class="member-section">
            <div class="section-label">KP</div>
            <div class="kp-card">
              <div class="m-avatar kp-avatar">{{ (campaign.kp.nickname || campaign.kp.username)[0] }}</div>
              <div class="m-info">
                <span class="m-main">{{ campaign.kp.nickname || campaign.kp.username }}</span>
                <span class="m-sub">守秘人</span>
              </div>
            </div>
          </div>

          <!-- 调查员 -->
          <div class="member-section">
            <div class="section-label">调查员 ({{ approvedPlayers.length }})</div>
            <div v-for="m in approvedPlayers" :key="m.userId" class="player-card">
              <div class="m-avatar" :class="m.investigator ? 'has-char' : 'no-char'">
                {{ m.investigator ? m.investigator.name[0] : (m.user.nickname || m.user.username)[0] }}
              </div>
              <div class="m-body">
                <div class="m-header-row">
                  <span class="m-main">{{ m.investigator?.name || '未绑定角色卡' }}</span>
                  <span v-if="m.investigator?.occupation" class="m-occ">{{ m.investigator.occupation.name }}</span>
                  <span class="m-sub">玩家: {{ m.user.nickname || m.user.username }}</span>
                </div>
                <div v-if="m.investigator" class="m-stats">
                  <div class="attr-row">
                    <div class="attr-cell"><span class="attr-label">STR</span><span class="attr-val">{{ m.investigator.str }}</span></div>
                    <div class="attr-cell"><span class="attr-label">CON</span><span class="attr-val">{{ m.investigator.con }}</span></div>
                    <div class="attr-cell"><span class="attr-label">SIZ</span><span class="attr-val">{{ m.investigator.siz }}</span></div>
                    <div class="attr-cell"><span class="attr-label">DEX</span><span class="attr-val">{{ m.investigator.dex }}</span></div>
                    <div class="attr-cell"><span class="attr-label">APP</span><span class="attr-val">{{ m.investigator.app }}</span></div>
                  </div>
                  <div class="attr-row">
                    <div class="attr-cell"><span class="attr-label">INT</span><span class="attr-val">{{ m.investigator.int }}</span></div>
                    <div class="attr-cell"><span class="attr-label">POW</span><span class="attr-val">{{ m.investigator.pow }}</span></div>
                    <div class="attr-cell"><span class="attr-label">EDU</span><span class="attr-val">{{ m.investigator.edu }}</span></div>
                    <div class="attr-cell"><span class="attr-label">LUCK</span><span class="attr-val">{{ m.investigator.luck }}</span></div>
                    <div class="attr-cell"><span class="attr-label">MOV</span><span class="attr-val">{{ m.investigator.mov || '-' }}</span></div>
                  </div>
                  <div class="hp-row">
                    <div class="hp-cell"><span class="hp-label">HP</span><n-progress type="line" :percentage="statPct(m.investigator.hp, m.investigator.maxHp)" :show-indicator="false" :height="4" :color="'#d9534f'" /><span class="hp-val">{{ m.investigator.hp || 0 }}/{{ m.investigator.maxHp || 0 }}</span></div>
                    <div class="hp-cell"><span class="hp-label">SAN</span><n-progress type="line" :percentage="statPct(m.investigator.san, m.investigator.maxSan)" :show-indicator="false" :height="4" :color="'#5bc0de'" /><span class="hp-val">{{ m.investigator.san || 0 }}/{{ m.investigator.maxSan || 0 }}</span></div>
                    <div class="hp-cell"><span class="hp-label">MP</span><n-progress type="line" :percentage="statPct(m.investigator.mp, m.investigator.maxMp)" :show-indicator="false" :height="4" :color="'#5cb85c'" /><span class="hp-val">{{ m.investigator.mp || 0 }}/{{ m.investigator.maxMp || 0 }}</span></div>
                  </div>
                </div>
              </div>
              <div v-if="isKp && m.userId !== campaign.kpId" class="m-actions">
                <n-button size="tiny" type="error" ghost @click="kickMember(m.userId)">踢出</n-button>
              </div>
            </div>
            <n-empty v-if="!approvedPlayers.length" description="暂无调查员" size="small" />
          </div>

          <!-- 待审核（仅KP可见） -->
          <div v-if="isKp && pendingPlayers.length" class="member-section">
            <div class="section-label">待审核 ({{ pendingPlayers.length }})</div>
            <div v-for="m in pendingPlayers" :key="m.userId" class="pending-card">
              <div class="m-avatar pending-avatar">{{ (m.user.nickname || m.user.username)[0] }}</div>
              <div class="m-info">
                <span class="m-main">{{ m.user.nickname || m.user.username }}</span>
                <span class="m-sub">等待审核</span>
              </div>
              <div class="m-actions">
                <n-button size="tiny" type="primary" @click="approveMember(m.userId)">通过</n-button>
                <n-button size="tiny" type="error" ghost @click="kickMember(m.userId)">拒绝</n-button>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- 场景 Tab ==== -->
      <n-tab-pane name="scenes" tab="场景">
        <div class="scenes-panel">
          <div v-if="isKp" class="scene-toolbar">
            <n-button size="small" type="primary" @click="openCreateScene">+ 新建场景</n-button>
          </div>

          <div v-for="s in campaign.scenes" :key="s.id" class="scene-card" :class="{ active: s.id === campaign.currentSceneId }">
            <div class="scene-main">
              <div class="scene-top">
                <div class="scene-info">
                  <span class="scene-name">{{ s.name }}</span>
                  <n-tag v-if="s.id === campaign.currentSceneId" size="tiny" type="success">当前场景</n-tag>
                </div>
                <div class="scene-actions">
                  <n-button v-if="isKp && s.id !== campaign.currentSceneId && campaign.status === 'ONGOING'" size="tiny" type="primary" @click="switchScene(s.id)">切换到此场景</n-button>
                  <n-button v-if="isKp" size="tiny" @click="editScene(s)">编辑</n-button>
                  <n-button v-if="isKp" size="tiny" type="error" ghost @click="deleteScene(s.id)">删除</n-button>
                </div>
              </div>
              <p class="scene-desc">{{ s.description || '暂无描述' }}</p>
            </div>

            <!-- 关联线索 -->
            <div class="scene-clues">
              <div class="clues-header">
                <span class="clues-label">关联线索 ({{ getSceneClues(s.id).length }})</span>
                <n-button v-if="isKp" size="tiny" text @click="openLinkClue(s)">+ 关联</n-button>
              </div>
              <div v-if="getSceneClues(s.id).length" class="clue-list">
                <div v-for="clue in getSceneClues(s.id)" :key="clue.id" class="clue-row">
                  <div class="clue-main">
                    <span class="clue-title">{{ clue.title }}</span>
                    <span class="clue-content">{{ clue.content }}</span>
                    <div v-if="clue.triggerCondition" class="clue-trigger">
                      <span class="trigger-label">触发:</span>
                      <span>{{ clue.triggerCondition }}</span>
                    </div>
                  </div>
                  <div v-if="isKp" class="clue-actions">
                    <n-button text size="tiny" @click="editClueTrigger(s, clue)">触发条件</n-button>
                    <n-button text size="tiny" type="error" @click="unlinkClue(s, clue)">取消关联</n-button>
                  </div>
                </div>
              </div>
              <div v-else class="no-clues">暂无线索关联</div>
            </div>
          </div>

          <n-empty v-if="!campaign.scenes.length" description="暂无场景" />
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- 场景编辑弹窗 -->
    <n-modal v-model:show="showSceneModal" :title="editingScene ? '编辑场景' : '新建场景'" preset="card" style="width: 400px">
      <n-form>
        <n-form-item label="场景名称" required>
          <n-input v-model:value="sceneForm.name" placeholder="场景名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="sceneForm.description" type="textarea" placeholder="场景描述" :rows="4" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showSceneModal = false">取消</n-button>
          <n-button type="primary" :loading="sceneLoading" @click="saveScene">{{ editingScene ? '保存' : '创建' }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 关联线索弹窗 -->
    <n-modal v-model:show="showLinkModal" title="关联线索" preset="card" style="width: 480px">
      <n-form>
        <n-form-item label="选择线索">
          <n-select
            v-model:value="linkForm.clueId"
            :options="unlinkedClues.map(c => ({ label: c.title, value: c.id }))"
            placeholder="选择已有线索"
            filterable
          />
        </n-form-item>
        <n-form-item label="触发条件">
          <n-input v-model:value="linkForm.triggerCondition" type="textarea" placeholder="描述玩家如何触发此线索，如：调查书架时发现、与NPC对话后获得" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showLinkModal = false">取消</n-button>
          <n-button type="primary" :loading="linkLoading" @click="saveLink">关联</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 触发条件编辑弹窗 -->
    <n-modal v-model:show="showTriggerModal" title="编辑触发条件" preset="card" style="width: 400px">
      <n-form>
        <n-form-item label="触发条件">
          <n-input v-model:value="triggerForm.condition" type="textarea" placeholder="描述触发条件" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showTriggerModal = false">取消</n-button>
          <n-button type="primary" :loading="triggerLoading" @click="saveTrigger">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import api from '@/api/client'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const campaign = ref<any>(null)
const allClues = ref<any[]>([])

// Scene form
const showSceneModal = ref(false)
const sceneLoading = ref(false)
const editingScene = ref<any>(null)
const sceneForm = ref({ name: '', description: '' })

// Link clue form
const showLinkModal = ref(false)
const linkLoading = ref(false)
const linkingScene = ref<any>(null)
const linkForm = ref({ clueId: '', triggerCondition: '' })

// Trigger form
const showTriggerModal = ref(false)
const triggerLoading = ref(false)
const editingTriggerClue = ref<any>(null)
const editingTriggerScene = ref<any>(null)
const triggerForm = ref({ condition: '' })

const approvedPlayers = computed(() =>
  (campaign.value?.members || []).filter((m: any) => m.status === 'APPROVED' && m.userId !== campaign.value?.kpId)
)
const pendingPlayers = computed(() =>
  (campaign.value?.members || []).filter((m: any) => m.status === 'PENDING')
)

const isKp = computed(() => campaign.value?.kpId === userId())
const isMySelf = computed(() => {
  if (!campaign.value) return false
  return !!campaign.value.members.some((m: any) => m.userId === userId() && m.status === 'APPROVED') || isKp.value
})
const currentScene = computed(() => {
  if (!campaign.value?.currentSceneId) return null
  return campaign.value.scenes.find((s: any) => s.id === campaign.value.currentSceneId)
})

// 未关联到某个场景的线索
const unlinkedClues = computed(() => {
  if (!linkingScene.value) return []
  const sceneId = linkingScene.value.id
  const linkedIds = new Set(
    allClues.value.filter((c: any) => c.sceneId === sceneId).map((c: any) => c.id)
  )
  return allClues.value.filter((c: any) => !linkedIds.has(c.id))
})

function getSceneClues(sceneId: string) {
  return allClues.value.filter((c: any) => c.sceneId === sceneId)
}

function userId() {
  try {
    const t = localStorage.getItem('token')
    if (!t) return ''
    const p = JSON.parse(atob(t.split('.')[1]))
    return p.sub || ''
  } catch { return '' }
}

function statPct(val: number, max: number) {
  return max ? Math.round((val / max) * 100) : 0
}
function statusType(status: string) {
  const map: Record<string, any> = { RECRUITING: 'success', ONGOING: 'warning', FINISHED: 'default' }
  return map[status] || 'default'
}
function statusText(status: string) {
  const map: Record<string, string> = { RECRUITING: '招募中', ONGOING: '进行中', FINISHED: '已结束' }
  return map[status] || status
}
function eraText(era: string) {
  const map: Record<string, string> = { MODERN: '现代', '1920S': '1920s', '1890S': '1890s' }
  return map[era] || era
}

async function load() {
  const id = route.params.id as string
  const [campRes, cluesRes] = await Promise.all([
    api.get(`/campaigns/${id}`),
    api.get(`/campaigns/${id}/clues`).catch(() => ({ data: [] })),
  ])
  campaign.value = campRes.data
  allClues.value = cluesRes.data || []
}

async function joinCampaign() {
  try {
    await api.post(`/campaigns/${campaign.value.id}/join`)
    message.success('申请已提交，等待KP审核')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '申请失败')
  }
}

async function approveMember(uid: string) {
  try {
    await api.post(`/campaigns/${campaign.value.id}/members/${uid}/approve`)
    message.success('已通过')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

async function kickMember(uid: string) {
  dialog.warning({
    title: '确认移除',
    content: '确定移除该成员吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.post(`/campaigns/${campaign.value.id}/members/${uid}/kick`)
        message.success('已移除')
        load()
      } catch (e: any) {
        message.error(e.response?.data?.message || '操作失败')
      }
    },
  })
}

async function startCampaign() {
  try {
    await api.post(`/campaigns/${campaign.value.id}/start`)
    message.success('跑团开始')
    load()
  } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
}

async function endCampaign() {
  dialog.warning({
    title: '确认结束',
    content: '确定结束跑团吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.post(`/campaigns/${campaign.value.id}/end`)
        message.success('跑团已结束')
        load()
      } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
    },
  })
}

// Scene CRUD
function openCreateScene() {
  editingScene.value = null
  sceneForm.value = { name: '', description: '' }
  showSceneModal.value = true
}

function editScene(s: any) {
  editingScene.value = s
  sceneForm.value = { name: s.name, description: s.description || '' }
  showSceneModal.value = true
}

async function saveScene() {
  if (!sceneForm.value.name.trim()) { message.error('请输入场景名称'); return }
  sceneLoading.value = true
  try {
    if (editingScene.value) {
      await api.patch(`/scenes/${editingScene.value.id}`, sceneForm.value)
    } else {
      await api.post(`/campaigns/${campaign.value.id}/scenes`, sceneForm.value)
    }
    showSceneModal.value = false
    editingScene.value = null
    sceneForm.value = { name: '', description: '' }
    message.success(editingScene.value ? '场景已更新' : '场景已创建')
    load()
  } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
  finally { sceneLoading.value = false }
}

async function switchScene(sceneId: string) {
  try {
    await api.post(`/campaigns/${campaign.value.id}/switch-scene/${sceneId}`)
    message.success('场景已切换')
    load()
  } catch (e: any) { message.error(e.response?.data?.message || '切换失败') }
}

function deleteScene(sceneId: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定删除该场景吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.delete(`/scenes/${sceneId}`)
        message.success('已删除')
        load()
      } catch (e: any) { message.error(e.response?.data?.message || '删除失败') }
    },
  })
}

// Clue linking
function openLinkClue(s: any) {
  linkingScene.value = s
  linkForm.value = { clueId: '', triggerCondition: '' }
  showLinkModal.value = true
}

async function saveLink() {
  if (!linkForm.value.clueId) { message.error('请选择线索'); return }
  linkLoading.value = true
  try {
    await api.patch(`/campaigns/${campaign.value.id}/clues/${linkForm.value.clueId}`, {
      sceneId: linkingScene.value.id,
      triggerCondition: linkForm.value.triggerCondition || undefined,
    })
    showLinkModal.value = false
    linkingScene.value = null
    message.success('线索已关联')
    const id = route.params.id as string
    const cluesRes = await api.get(`/campaigns/${id}/clues`).catch(() => ({ data: [] }))
    allClues.value = cluesRes.data || []
  } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
  finally { linkLoading.value = false }
}

function editClueTrigger(s: any, clue: any) {
  editingTriggerScene.value = s
  editingTriggerClue.value = clue
  triggerForm.value = { condition: clue.triggerCondition || '' }
  showTriggerModal.value = true
}

async function saveTrigger() {
  triggerLoading.value = true
  try {
    await api.patch(`/campaigns/${campaign.value.id}/clues/${editingTriggerClue.value.id}`, {
      triggerCondition: triggerForm.value.condition || undefined,
    })
    showTriggerModal.value = false
    message.success('触发条件已更新')
    const id = route.params.id as string
    const cluesRes = await api.get(`/campaigns/${id}/clues`).catch(() => ({ data: [] }))
    allClues.value = cluesRes.data || []
  } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
  finally { triggerLoading.value = false }
}

async function unlinkClue(s: any, clue: any) {
  dialog.warning({
    title: '取消关联',
    content: `确定将「${clue.title}」从「${s.name}」取消关联？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.patch(`/campaigns/${campaign.value.id}/clues/${clue.id}`, {
          sceneId: null,
          triggerCondition: null,
        })
        message.success('已取消关联')
        load()
      } catch (e: any) { message.error(e.response?.data?.message || '操作失败') }
    },
  })
}

function enterRoom() {
  router.push(`/room/${campaign.value.id}`)
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.meta { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.5rem; flex-wrap: wrap; }
.meta span { font-size: 0.9rem; color: #666; }
.desc { color: #555; line-height: 1.6; margin-bottom: 1.5rem; }
.scene-box { background: #f9f9f5; padding: 1rem 1.2rem; border-radius: 8px; margin-top: 1rem; }
.scene-box h4 { margin-bottom: 0.5rem; }

/* === 成员面板 === */
.members-panel { padding: 0.5rem 0; }
.member-section { margin-bottom: 1.25rem; }
.section-label {
  font-size: 0.75rem; font-weight: 600; color: #999;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 0.5rem; padding-bottom: 0.3rem;
  border-bottom: 1px solid #f0f0f0;
}

.kp-card, .player-card, .pending-card {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem; border: 1px solid #f0f0f0; border-radius: 10px;
  margin-bottom: 0.5rem; transition: box-shadow 0.15s;
}
.kp-card { background: #fdf5ed; border-color: #e8d5b7; }
.player-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.pending-card { background: #fffef5; border-color: #f0e8a0; }

.m-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 600; flex-shrink: 0;
  background: #f0f0f0; color: #888;
}
.m-avatar.kp-avatar { background: #8B4513; color: #fff; }
.m-avatar.has-char { background: #d4e6f9; color: #3a7abd; }
.m-avatar.pending-avatar { background: #f5f0d0; color: #b09820; }

.m-info { flex: 1; min-width: 0; }

.m-body { flex: 1; min-width: 0; }
.m-header-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.m-main { font-size: 0.9rem; font-weight: 500; color: #333; }
.m-occ { font-size: 0.75rem; color: #8B4513; background: #fdf5ed; padding: 0.1rem 0.5rem; border-radius: 4px; }
.m-sub { font-size: 0.75rem; color: #999; }

.m-stats { margin-top: 0.2rem; }
.attr-row { display: flex; gap: 0; margin-bottom: 0.15rem; }
.attr-cell {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 0.2rem 0.1rem; background: #fafafa; border-radius: 4px; margin-right: 2px;
}
.attr-label { font-size: 0.6rem; color: #aaa; font-weight: 600; }
.attr-val { font-size: 0.8rem; color: #333; font-weight: 500; }

.hp-row { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
.hp-cell { flex: 1; display: flex; align-items: center; gap: 0.3rem; }
.hp-label { font-size: 0.65rem; color: #aaa; width: 24px; }
.hp-val { font-size: 0.6rem; color: #999; width: 40px; text-align: right; }

.m-actions { display: flex; gap: 0.3rem; flex-shrink: 0; align-items: flex-start; padding-top: 0.3rem; }

/* === 场景面板 === */
.scenes-panel { padding: 0.5rem 0; }
.scene-toolbar { margin-bottom: 1rem; }
.scene-card {
  border: 1px solid #f0f0f0; border-radius: 10px; padding: 1rem;
  margin-bottom: 0.75rem; transition: box-shadow 0.15s;
}
.scene-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.scene-card.active { border-color: #18a058; background: #f6fdf9; }

.scene-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.scene-info { display: flex; align-items: center; gap: 0.5rem; }
.scene-name { font-size: 1rem; font-weight: 600; color: #333; }
.scene-actions { display: flex; gap: 0.3rem; }
.scene-desc { font-size: 0.85rem; color: #666; line-height: 1.5; margin: 0.3rem 0 0; }

.scene-clues { margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px dashed #f0f0f0; }
.clues-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.clues-label { font-size: 0.75rem; color: #aaa; font-weight: 500; }

.clue-list { display: flex; flex-direction: column; gap: 0.35rem; }
.clue-row {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.5rem 0.75rem; background: #fafafa; border-radius: 6px;
}
.clue-main { flex: 1; min-width: 0; }
.clue-title { display: block; font-size: 0.85rem; font-weight: 500; color: #333; }
.clue-content { display: block; font-size: 0.75rem; color: #888; margin-top: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.clue-trigger {
  margin-top: 0.3rem; padding: 0.3rem 0.5rem;
  background: #fdf5ed; border-radius: 4px;
  border-left: 2px solid #c49a6c;
  font-size: 0.75rem; color: #888;
}
.trigger-label { font-weight: 600; color: #c49a6c; font-size: 0.7rem; }
.clue-actions { display: flex; gap: 0.25rem; flex-shrink: 0; padding-top: 0.1rem; }
.no-clues { font-size: 0.75rem; color: #ccc; padding: 0.3rem 0; }
</style>
