<template>
  <div class="page">
    <div class="back-bar">
      <n-button text @click="$router.push('/')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回首页
      </n-button>
    </div>

    <div class="header">
      <h2>角色卡审核</h2>
      <n-button @click="loadQueue" :loading="loading">刷新</n-button>
    </div>

    <n-empty v-if="!loading && queue.length === 0" description="暂无待审核的角色卡" />

    <div v-else class="review-list">
      <div v-for="inv in queue" :key="inv.id" class="review-card">
        <div class="review-header">
          <div class="review-info">
            <h3>{{ inv.name }}</h3>
            <div class="review-meta">
              <span>提交者: {{ inv.user?.nickname || inv.user?.username }}</span>
              <span v-if="inv.occupation">职业: {{ inv.occupation.name }}</span>
              <span>提交时间: {{ formatDate(inv.submittedAt) }}</span>
            </div>
          </div>
          <n-space>
            <n-button type="success" size="small" @click="doApprove(inv)">通过</n-button>
            <n-button type="error" size="small" @click="showRejectDialog(inv)">驳回</n-button>
            <n-button size="small" @click="viewDetail(inv)">查看详情</n-button>
          </n-space>
        </div>

        <div class="review-attrs">
          <div class="attr-mini" v-for="a in attrs" :key="a.key">
            <label>{{ a.label }}</label>
            <span>{{ inv[a.key] ?? '-' }}</span>
          </div>
        </div>

        <div v-if="inv.reviewNote" class="review-note">
          <n-tag type="error" size="small">上次驳回原因</n-tag>
          <span>{{ inv.reviewNote }}</span>
        </div>
      </div>
    </div>

    <!-- Reject dialog -->
    <n-modal v-model:show="rejectVisible" preset="dialog" title="驳回角色卡" positive-text="确认驳回" negative-text="取消" @positive-click="doReject">
      <p>请填写驳回原因（将反馈给玩家）：</p>
      <n-input v-model:value="rejectNote" type="textarea" placeholder="驳回原因..." :rows="3" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { investigatorsApi } from '@/api/investigators'

const router = useRouter()
const message = useMessage()

const queue = ref<any[]>([])
const loading = ref(false)
const rejectVisible = ref(false)
const rejectNote = ref('')
const rejectTarget = ref<any>(null)

const attrs = [
  { key: 'str', label: '力量' },
  { key: 'con', label: '体质' },
  { key: 'siz', label: '体型' },
  { key: 'dex', label: '敏捷' },
  { key: 'app', label: '外貌' },
  { key: 'int', label: '智力' },
  { key: 'pow', label: '意志' },
  { key: 'edu', label: '教育' },
  { key: 'luck', label: '幸运' },
]

async function loadQueue() {
  loading.value = true
  try {
    const res = await investigatorsApi.reviewQueue()
    queue.value = res.data
  } catch (e: any) {
    message.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function doApprove(inv: any) {
  try {
    await investigatorsApi.approve(inv.id)
    message.success(`${inv.name} 已通过审核`)
    queue.value = queue.value.filter((i) => i.id !== inv.id)
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

function showRejectDialog(inv: any) {
  rejectTarget.value = inv
  rejectNote.value = ''
  rejectVisible.value = true
}

async function doReject() {
  if (!rejectTarget.value) return
  try {
    await investigatorsApi.reject(rejectTarget.value.id, rejectNote.value || '未通过审核')
    message.success(`已驳回 ${rejectTarget.value.name}`)
    queue.value = queue.value.filter((i) => i.id !== rejectTarget.value.id)
    rejectVisible.value = false
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  }
}

function viewDetail(inv: any) {
  router.push(`/investigator/${inv.id}`)
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(() => loadQueue())
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header h2 { margin: 0; }

.review-list { display: flex; flex-direction: column; gap: 1rem; }
.review-card {
  background: #fff; border-radius: 12px; padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #f0a020;
}
.review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.review-info h3 { margin: 0 0 0.5rem 0; color: #8B4513; }
.review-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: #888; }

.review-attrs { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.attr-mini { background: #f9f9f5; padding: 0.4rem 0.75rem; border-radius: 6px; text-align: center; min-width: 60px; }
.attr-mini label { display: block; font-size: 0.7rem; color: #999; }
.attr-mini span { font-size: 1rem; font-weight: 600; color: #8B4513; }

.review-note { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #e74c3c; margin-top: 0.5rem; }
</style>
