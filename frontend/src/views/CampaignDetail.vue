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
        <n-button v-if="campaign.status === 'ONGOING' && isMember" type="primary" @click="enterRoom">进入房间</n-button>
        <n-button v-if="!isMember && !isKp && campaign.status === 'RECRUITING'" type="primary" @click="joinCampaign">申请加入</n-button>
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

      <n-tab-pane name="members" tab="成员">
        <n-table :data="campaign.members" :columns="memberColumns" size="small" />

        <div v-if="isKp && pendingMembers.length" class="pending-section">
          <h4>待审核</h4>
          <n-space v-for="m in pendingMembers" :key="m.id" align="center">
            <span>{{ m.user.nickname || m.user.username }}</span>
            <n-button size="small" type="primary" @click="approveMember(m.userId)">通过</n-button>
            <n-button size="small" @click="kickMember(m.userId)">拒绝</n-button>
          </n-space>
        </div>

        <div v-if="isMember && !isKp && myMember && !myMember.investigatorId" class="bind-section">
          <h4>绑定角色卡</h4>
          <n-select v-model:value="selectedInv" :options="myInvestigators.map(i => ({ label: i.name, value: i.id }))" placeholder="选择角色卡" />
          <n-button size="small" type="primary" @click="bindInvestigator">绑定</n-button>
        </div>
      </n-tab-pane>

      <n-tab-pane name="scenes" tab="场景">
        <div v-if="isKp" class="scene-actions">
          <n-button size="small" @click="showSceneModal = true">+ 新建场景</n-button>
        </div>
        <n-list>
          <n-list-item v-for="s in campaign.scenes" :key="s.id">
            <n-thing :title="s.name" :description="s.description || '无描述'">
              <template #header-extra>
                <n-tag v-if="s.isActive" type="success">当前</n-tag>
                <n-button v-if="isKp && !s.isActive && campaign.status === 'ONGOING'" size="tiny" @click="switchScene(s.id)">切换</n-button>
                <n-button v-if="isKp" size="tiny" type="error" @click="deleteScene(s.id)">删除</n-button>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
        <n-empty v-if="!campaign.scenes.length" description="暂无场景" />
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showSceneModal" title="新建场景" preset="card" style="width: 400px">
      <n-form>
        <n-form-item label="场景名称">
          <n-input v-model:value="sceneForm.name" placeholder="场景名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="sceneForm.description" type="textarea" placeholder="场景描述" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showSceneModal = false">取消</n-button>
          <n-button type="primary" :loading="sceneLoading" @click="createScene">创建</n-button>
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
const myInvestigators = ref<any[]>([])
const selectedInv = ref('')
const showSceneModal = ref(false)
const sceneLoading = ref(false)
const sceneForm = ref({ name: '', description: '' })

const memberColumns = [
  { title: '玩家', key: 'user', render: (row: any) => row.user.nickname || row.user.username },
  { title: '角色', key: 'investigator', render: (row: any) => row.investigator?.name || '-' },
  { title: '状态', key: 'status', render: (row: any) => row.status === 'APPROVED' ? '已通过' : '待审核' },
  {
    title: '操作',
    key: 'actions',
    render: (row: any) => {
      if (!isKp.value || row.status !== 'APPROVED' || row.userId === campaign.value?.kpId) return '-'
      return h('n-button', { size: 'tiny', onClick: () => kickMember(row.userId) }, '踢出')
    },
  },
]

const isKp = computed(() => campaign.value?.kpId === userId())
const isMember = computed(() => {
  if (!campaign.value) return false
  if (isKp.value) return true
  return campaign.value.members.some((m: any) => m.userId === userId() && m.status === 'APPROVED')
})
const myMember = computed(() => campaign.value?.members.find((m: any) => m.userId === userId()))
const pendingMembers = computed(() => campaign.value?.members.filter((m: any) => m.status === 'PENDING') || [])
const currentScene = computed(() => {
  if (!campaign.value?.currentSceneId) return null
  return campaign.value.scenes.find((s: any) => s.id === campaign.value.currentSceneId)
})

function userId() {
  try {
    const t = localStorage.getItem('token')
    if (!t) return ''
    const p = JSON.parse(atob(t.split('.')[1]))
    return p.sub || ''
  } catch { return '' }
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
  const res = await api.get(`/campaigns/${id}`)
  campaign.value = res.data
}

async function loadInvestigators() {
  const res = await api.get('/investigators', { params: { status: 'APPROVED' } })
  myInvestigators.value = res.data || []
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

async function approveMember(userId: string) {
  try {
    await api.post(`/campaigns/${campaign.value.id}/members/${userId}/approve`)
    message.success('已通过')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

async function kickMember(userId: string) {
  dialog.warning({
    title: '确认移除',
    content: '确定移除该成员吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.post(`/campaigns/${campaign.value.id}/members/${userId}/kick`)
        message.success('已移除')
        load()
      } catch (e: any) {
        message.error(e.response?.data?.message || '操作失败')
      }
    },
  })
}

async function bindInvestigator() {
  if (!selectedInv.value) {
    message.error('请选择角色卡')
    return
  }
  try {
    await api.post(`/campaigns/${campaign.value.id}/bind-investigator`, { investigatorId: selectedInv.value })
    message.success('绑定成功')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '绑定失败')
  }
}

async function startCampaign() {
  try {
    await api.post(`/campaigns/${campaign.value.id}/start`)
    message.success('跑团开始')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
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
      } catch (e: any) {
        message.error(e.response?.data?.message || '操作失败')
      }
    },
  })
}

async function createScene() {
  if (!sceneForm.value.name.trim()) {
    message.error('请输入场景名称')
    return
  }
  sceneLoading.value = true
  try {
    await api.post(`/campaigns/${campaign.value.id}/scenes`, sceneForm.value)
    showSceneModal.value = false
    message.success('场景创建成功')
    sceneForm.value = { name: '', description: '' }
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '创建失败')
  } finally {
    sceneLoading.value = false
  }
}

async function switchScene(sceneId: string) {
  try {
    await api.post(`/campaigns/${campaign.value.id}/switch-scene/${sceneId}`)
    message.success('场景已切换')
    load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '切换失败')
  }
}

async function deleteScene(sceneId: string) {
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
      } catch (e: any) {
        message.error(e.response?.data?.message || '删除失败')
      }
    },
  })
}

function enterRoom() {
  router.push(`/room/${campaign.value.id}`)
}

// naive-ui table columns need h, import it
import { h } from 'vue'

onMounted(() => {
  load()
  loadInvestigators()
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
.pending-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #ddd; }
.pending-section h4 { margin-bottom: 0.75rem; }
.bind-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #ddd; }
.bind-section h4 { margin-bottom: 0.75rem; }
.scene-actions { margin-bottom: 1rem; }
</style>
