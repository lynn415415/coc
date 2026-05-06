<template>
  <div class="clue-panel">
    <div class="clue-toolbar">
      <n-input v-model:value="search" placeholder="搜索线索..." size="small" clearable />
      <n-select
        v-model:value="privacyFilter"
        :options="privacyOptions"
        size="small"
        style="width: 100px"
      />
    </div>

    <div v-if="isKp" class="clue-actions">
      <n-button size="small" type="primary" block @click="openCreate">+ 新建线索</n-button>
    </div>

    <div class="clue-list">
      <div v-if="!filteredClues.length" class="clue-empty">暂无线索</div>
      <div
        v-for="c in filteredClues"
        :key="c.id"
        class="clue-card"
        :class="`privacy-${c.privacy}`"
        @click="openDetail(c)"
      >
        <div class="clue-card-header">
          <n-tag :type="entityTagType(c.entityType)" size="tiny">{{ entityLabel(c.entityType) }}</n-tag>
          <n-tag :type="privacyTagType(c.privacy)" size="tiny">{{ privacyLabel(c.privacy) }}</n-tag>
        </div>
        <div class="clue-card-title">{{ c.title }}</div>
        <div class="clue-card-preview">{{ c.content.slice(0, 60) }}{{ c.content.length > 60 ? '...' : '' }}</div>
      </div>
    </div>

    <!-- Detail Modal -->
    <n-modal :show="detailVisible" preset="card" title="线索详情" style="width: 520px" @update:show="closeDetail">
      <template v-if="selectedClue">
        <div class="detail-section">
          <div class="detail-row"><b>标题：</b>{{ selectedClue.title }}</div>
          <div class="detail-row"><b>类型：</b>{{ entityLabel(selectedClue.entityType) }}</div>
          <div class="detail-row">
            <b>隐私：</b>
            <n-tag :type="privacyTagType(selectedClue.privacy)" size="small">{{ privacyLabel(selectedClue.privacy) }}</n-tag>
          </div>
          <div class="detail-row"><b>内容：</b>{{ selectedClue.content }}</div>
        </div>

        <div v-if="relations.outgoing.length || relations.incoming.length" class="relation-section">
          <h4>关联线索</h4>
          <div v-for="r in relations.outgoing" :key="r.id" class="relation-row">
            → {{ r.targetId }} ({{ r.relationType }})
          </div>
          <div v-for="r in relations.incoming" :key="r.id" class="relation-row">
            ← {{ r.sourceId }} ({{ r.relationType }})
          </div>
        </div>
      </template>

      <template v-if="isKp" #footer>
        <n-space justify="end">
          <n-button size="small" type="error" ghost @click="deleteClue">删除</n-button>
          <n-button size="small" type="primary" @click="openEdit">编辑</n-button>
          <n-button size="small" @click="showShare = true">分享给...</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Share Modal -->
    <n-modal v-model:show="showShare" preset="card" title="分享线索给成员" style="width: 360px">
      <n-select v-model:value="shareTarget" :options="memberOptions" placeholder="选择成员" />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showShare = false">取消</n-button>
          <n-button type="primary" :disabled="!shareTarget" @click="doShare">确认分享</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Create Modal -->
    <n-modal v-model:show="showCreate" preset="card" title="新建线索" style="width: 480px">
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="createForm.title" placeholder="线索标题" />
        </n-form-item>
        <n-form-item label="内容">
          <n-input v-model:value="createForm.content" type="textarea" :rows="4" placeholder="线索内容" />
        </n-form-item>
        <n-form-item label="类型">
          <n-select v-model:value="createForm.entityType" :options="entityOptions" />
        </n-form-item>
        <n-form-item label="隐私级别">
          <n-select v-model:value="createForm.privacy" :options="privacyOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="createClue">创建</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Edit Modal -->
    <n-modal v-model:show="showEdit" preset="card" title="编辑线索" style="width: 480px">
      <n-form v-if="editForm">
        <n-form-item label="标题">
          <n-input v-model:value="editForm.title" />
        </n-form-item>
        <n-form-item label="内容">
          <n-input v-model:value="editForm.content" type="textarea" :rows="4" />
        </n-form-item>
        <n-form-item label="隐私级别">
          <n-select v-model:value="editForm.privacy" :options="privacyOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEdit = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="saveClue">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Relation Graph -->
    <div v-if="showGraph" class="graph-section">
      <RelationGraph :campaign-id="campaignId" />
    </div>
    <n-button v-if="!showGraph" size="tiny" block @click="showGraph = true" style="margin-top: 8px">
      查看关联图谱
    </n-button>
    <n-button v-else size="tiny" block @click="showGraph = false" style="margin-top: 8px">
      隐藏图谱
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import api from '@/api/client'
import RelationGraph from './RelationGraph.vue'

const props = defineProps<{
  campaignId: string
  isKp: boolean
  members?: Array<{ userId: string; user?: { nickname?: string; username?: string }; role?: string }>
}>()

const showShare = ref(false)
const shareTarget = ref('')

const message = useMessage()
const clues = ref<any[]>([])
const search = ref('')
const privacyFilter = ref('all')
const selectedClue = ref<any>(null)
const showGraph = ref(false)
const showCreate = ref(false)
const showEdit = ref(false)
const creating = ref(false)
const saving = ref(false)
const editForm = ref<any>(null)
const relations = ref<{ outgoing: any[]; incoming: any[] }>({ outgoing: [], incoming: [] })
const createForm = ref({ title: '', content: '', entityType: 'clue', privacy: 'private' })

const detailVisible = computed(() => !!selectedClue.value)

const privacyOptions = [
  { label: '全部', value: 'all' },
  { label: '公开', value: 'public' },
  { label: '共享', value: 'shared' },
  { label: '私有', value: 'private' },
  { label: '指定用户', value: 'specific_user' },
]

const memberOptions = computed(() =>
  (props.members || [])
    .filter(m => m.userId !== getUserId())
    .map(m => ({
      label: m.user?.nickname || m.user?.username || m.userId,
      value: m.userId,
    }))
)

const entityOptions = [
  { label: '线索', value: 'clue' },
  { label: 'NPC', value: 'npc' },
  { label: '地点', value: 'location' },
  { label: '组织', value: 'organization' },
  { label: '事件', value: 'event' },
]

const filteredClues = computed(() => {
  let result = clues.value
  if (privacyFilter.value !== 'all') {
    result = result.filter((c: any) => c.privacy === privacyFilter.value)
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter((c: any) =>
      c.title.toLowerCase().includes(s) || c.content.toLowerCase().includes(s)
    )
  }
  return result
})

function entityLabel(type: string) {
  const map: Record<string, string> = { clue: '线索', npc: 'NPC', location: '地点', organization: '组织', event: '事件' }
  return map[type] || type
}

function entityTagType(type: string) {
  const map: Record<string, string> = { clue: 'info', npc: 'warning', location: 'success', organization: 'default', event: 'error' }
  return (map[type] || 'default') as any
}

function privacyLabel(p: string) {
  const map: Record<string, string> = { public: '公开', shared: '共享', private: '私有', specific_user: '指定用户' }
  return map[p] || p
}

function privacyTagType(p: string) {
  const map: Record<string, string> = { public: 'success', shared: 'info', private: 'default', specific_user: 'warning' }
  return (map[p] || 'default') as any
}

async function loadClues() {
  try {
    const res = await api.get(`/campaigns/${props.campaignId}/clues`)
    clues.value = res.data || []
  } catch { clues.value = [] }
}

function openCreate() { showCreate.value = true }
function openDetail(c: any) { selectedClue.value = c }
function closeDetail() { selectedClue.value = null }
function openEdit() {
  if (selectedClue.value) {
    editForm.value = { ...selectedClue.value }
    showEdit.value = true
  }
}

async function createClue() {
  if (!createForm.value.title.trim()) { message.error('请输入标题'); return }
  creating.value = true
  try {
    await api.post(`/campaigns/${props.campaignId}/clues`, createForm.value)
    showCreate.value = false
    createForm.value = { title: '', content: '', entityType: 'clue', privacy: 'private' }
    message.success('线索已创建')
    loadClues()
  } catch (e: any) {
    message.error(e.response?.data?.message || '创建失败')
  } finally { creating.value = false }
}

async function saveClue() {
  if (!selectedClue.value) return
  saving.value = true
  try {
    await api.patch(`/campaigns/${props.campaignId}/clues/${selectedClue.value.id}`, editForm.value)
    showEdit.value = false
    message.success('已保存')
    selectedClue.value = null
    loadClues()
  } catch (e: any) {
    message.error(e.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

async function deleteClue() {
  if (!selectedClue.value) return
  try {
    await api.delete(`/campaigns/${props.campaignId}/clues/${selectedClue.value.id}`)
    message.success('已删除')
    selectedClue.value = null
    loadClues()
  } catch (e: any) {
    message.error(e.response?.data?.message || '删除失败')
  }
}

function getUserId() {
  try {
    const t = localStorage.getItem('token') || ''
    return JSON.parse(atob(t.split('.')[1])).sub
  } catch { return '' }
}

async function doShare() {
  if (!selectedClue.value || !shareTarget.value) return
  try {
    await api.post(`/campaigns/${props.campaignId}/clues/${selectedClue.value.id}/share`, {
      userId: shareTarget.value,
    })
    message.success('已分享')
    showShare.value = false
    shareTarget.value = ''
    loadClues()
  } catch (e: any) {
    message.error(e.response?.data?.message || '分享失败')
  }
}

watch(() => selectedClue.value, async (c) => {
  if (c) {
    try {
      const res = await api.get(`/campaigns/${props.campaignId}/relations/entity/${c.id}`)
      relations.value = res.data
    } catch { relations.value = { outgoing: [], incoming: [] } }
  }
})

onMounted(loadClues)
</script>

<style scoped>
.clue-panel { display: flex; flex-direction: column; height: 100%; background: #1a1a2e; }
.clue-toolbar { display: flex; gap: 8px; padding: 8px; border-bottom: 1px solid #2a2a3e; }
.clue-actions { padding: 8px; border-bottom: 1px solid #2a2a3e; }
.clue-list { flex: 1; overflow-y: auto; padding: 4px; }
.clue-empty { padding: 24px; text-align: center; color: #666; font-size: 13px; }
.clue-card { padding: 8px 10px; margin: 4px; border-radius: 6px; cursor: pointer; border-left: 3px solid #666; background: #222233; transition: background 0.15s; }
.clue-card:hover { background: #2a2a3e; }
.clue-card.privacy-public { border-left-color: #27ae60; }
.clue-card.privacy-shared { border-left-color: #3498db; }
.clue-card.privacy-specific_user { border-left-color: #f39c12; }
.clue-card.privacy-private { border-left-color: #666; }
.clue-card-header { display: flex; gap: 4px; margin-bottom: 4px; }
.clue-card-title { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.clue-card-preview { font-size: 11px; color: #888; line-height: 1.4; }
.detail-section { margin-bottom: 8px; }
.detail-row { padding: 4px 0; font-size: 13px; line-height: 1.6; }
.relation-section { margin-top: 16px; padding-top: 12px; border-top: 1px solid #333; }
.relation-section h4 { font-size: 12px; color: #888; margin-bottom: 8px; }
.relation-row { font-size: 11px; color: #aaa; padding: 2px 0; }
</style>
