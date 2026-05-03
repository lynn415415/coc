<template>
  <div class="page">
    <div class="header">
      <h2>跑团列表</h2>
      <n-button type="primary" @click="showCreate = true">创建跑团</n-button>
    </div>

    <div v-if="hosted.length" class="section">
      <h3>我主持的</h3>
      <div class="card-grid">
        <div v-for="c in hosted" :key="c.id" class="campaign-card" @click="goDetail(c.id)">
          <div class="card-title">{{ c.title }}</div>
          <div class="card-meta">
            <n-tag size="small" :type="statusType(c.status)">{{ statusText(c.status) }}</n-tag>
            <span>{{ c._count.members }}/{{ c.maxPlayers }} 人</span>
            <span v-if="c.era">{{ eraText(c.era) }}</span>
          </div>
          <div class="card-desc">{{ c.description || '暂无描述' }}</div>
        </div>
      </div>
    </div>

    <div v-if="joined.length" class="section">
      <h3>我参与的</h3>
      <div class="card-grid">
        <div v-for="c in joined" :key="c.id" class="campaign-card" @click="goDetail(c.id)">
          <div class="card-title">{{ c.title }}</div>
          <div class="card-meta">
            <n-tag size="small" :type="statusType(c.status)">{{ statusText(c.status) }}</n-tag>
            <span>{{ c._count.members }}/{{ c.maxPlayers }} 人</span>
            <span>KP: {{ c.kp.nickname || c.kp.username }}</span>
          </div>
          <div class="card-desc">{{ c.description || '暂无描述' }}</div>
        </div>
      </div>
    </div>

    <n-empty v-if="!hosted.length && !joined.length" description="暂无跑团，创建一个吧" />

    <n-modal v-model:show="showCreate" title="创建跑团" preset="card" style="width: 480px">
      <n-form :model="createForm" label-placement="left" label-width="80">
        <n-form-item label="标题" required>
          <n-input v-model:value="createForm.title" placeholder="跑团标题" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="createForm.description" type="textarea" placeholder="跑团描述" />
        </n-form-item>
        <n-form-item label="时代">
          <n-select v-model:value="createForm.era" :options="eraOptions" />
        </n-form-item>
        <n-form-item label="人数上限">
          <n-input-number v-model:value="createForm.maxPlayers" :min="1" :max="10" />
        </n-form-item>
        <n-form-item label="车卡方式">
          <n-select v-model:value="createForm.rollMethod" :options="rollMethodOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="doCreate">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const router = useRouter()
const message = useMessage()

const hosted = ref<any[]>([])
const joined = ref<any[]>([])
const showCreate = ref(false)
const creating = ref(false)
const createForm = ref({ title: '', description: '', era: 'MODERN', maxPlayers: 4, rollMethod: 'DICE' })

const eraOptions = [
  { label: '现代', value: 'MODERN' },
  { label: '1920s', value: '1920S' },
  { label: '1890s', value: '1890S' },
]
const rollMethodOptions = [
  { label: '骰子Roll点', value: 'DICE' },
  { label: '购点法', value: 'POINT_BUY' },
]

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
  const res = await api.get('/campaigns')
  hosted.value = res.data.hosted || []
  joined.value = res.data.joined || []
}

async function doCreate() {
  if (!createForm.value.title.trim()) {
    message.error('请输入标题')
    return
  }
  creating.value = true
  try {
    const res = await api.post('/campaigns', createForm.value)
    showCreate.value = false
    message.success('创建成功')
    router.push(`/campaigns/${res.data.id}`)
  } catch (e: any) {
    message.error(e.response?.data?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

function goDetail(id: string) {
  router.push(`/campaigns/${id}`)
}

onMounted(load)
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.section { margin-bottom: 2rem; }
.section h3 { margin-bottom: 1rem; font-size: 1.1rem; color: #333; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.campaign-card { background: #fff; border: 1px solid #e8e8e3; border-radius: 12px; padding: 1.2rem; cursor: pointer; transition: box-shadow 0.2s; }
.campaign-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.card-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem; }
.card-meta { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem; font-size: 0.85rem; color: #666; }
.card-desc { font-size: 0.9rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
