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
      <h2>我的角色卡</h2>
      <router-link to="/investigator/new">
        <n-button type="primary">+ 新建角色卡</n-button>
      </router-link>
    </div>

    <n-empty v-if="!loading && investigators.length === 0" description="还没有角色卡，去创建一个吧">
      <template #extra>
        <router-link to="/investigator/new">
          <n-button>创建调查员</n-button>
        </router-link>
      </template>
    </n-empty>

    <div v-else class="card-list">
      <div v-for="inv in investigators" :key="inv.id" class="inv-card">
        <router-link :to="`/investigator/${inv.id}`">
          <div class="inv-header">
            <h3>{{ inv.name }}</h3>
            <n-tag :type="statusType(inv.status)">{{ statusText(inv.status) }}</n-tag>
          </div>
          <div class="inv-body">
            <div class="stat-row">
              <span>HP: {{ inv.hp }}/{{ inv.maxHp }}</span>
              <span>SAN: {{ inv.san }}/{{ inv.maxSan }}</span>
            </div>
            <div class="meta">
              <span>{{ eraText(inv.era) }}</span>
              <span v-if="inv.age">{{ inv.age }}岁</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'

const investigators = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  const res = await api.get('/investigators')
  investigators.value = res.data
  loading.value = false
})

function statusType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'default',
    PENDING: 'warning',
    APPROVED: 'success',
    ARCHIVED: 'error',
  }
  return map[status] || 'default'
}

function statusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '已通过',
    ARCHIVED: '已归档',
  }
  return map[status] || status
}

function eraText(era: string) {
  const map: Record<string, string> = {
    MODERN: '现代',
    Y1920S: '1920s',
    GASLIGHT: '煤气灯',
    PULP: 'Pulp',
  }
  return map[era] || era
}
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.inv-card {
  background: white; border-radius: 12px; padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s;
}
.inv-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.inv-card a { text-decoration: none; color: inherit; }
.inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.inv-header h3 { color: #8B4513; margin: 0; }
.stat-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem; color: #555; }
.meta { font-size: 0.85rem; color: #999; display: flex; gap: 0.75rem; }
</style>
