<template>
  <div v-if="inv" class="page">
    <div class="back-bar">
      <n-button text @click="$router.push('/investigators')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回角色卡列表
      </n-button>
    </div>
    <div class="header">
      <h2>{{ inv.name }}</h2>
      <n-tag :type="statusType(inv.status)">{{ statusText(inv.status) }}</n-tag>
    </div>

    <n-tabs type="line">
      <n-tab-pane name="attr" tab="属性">
        <div class="attr-grid">
          <div class="attr-box"><label>{{ attrMap.str }}</label><span>{{ inv.str }}</span></div>
          <div class="attr-box"><label>{{ attrMap.con }}</label><span>{{ inv.con }}</span></div>
          <div class="attr-box"><label>{{ attrMap.siz }}</label><span>{{ inv.siz }}</span></div>
          <div class="attr-box"><label>{{ attrMap.dex }}</label><span>{{ inv.dex }}</span></div>
          <div class="attr-box"><label>{{ attrMap.app }}</label><span>{{ inv.app }}</span></div>
          <div class="attr-box"><label>{{ attrMap.int }}</label><span>{{ inv.int }}</span></div>
          <div class="attr-box"><label>{{ attrMap.pow }}</label><span>{{ inv.pow }}</span></div>
          <div class="attr-box"><label>{{ attrMap.edu }}</label><span>{{ inv.edu }}</span></div>
        </div>
        <div class="derived">
          <div>HP: {{ inv.hp }}/{{ inv.maxHp }}</div>
          <div>SAN: {{ inv.san }}/{{ inv.maxSan }}</div>
          <div>MP: {{ inv.mp }}/{{ inv.maxMp }}</div>
          <div>MOV: {{ inv.mov }}</div>
          <div>DB: {{ inv.db }}</div>
          <div>Build: {{ inv.build }}</div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="skills" tab="技能">
        <n-empty description="技能分配功能开发中" />
      </n-tab-pane>

      <n-tab-pane name="story" tab="背景">
        <div class="story">
          <div v-if="inv.description"><h4>形象描述</h4><p>{{ inv.description }}</p></div>
          <div v-if="inv.belief"><h4>信仰/信念</h4><p>{{ inv.belief }}</p></div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="actions">
      <n-button v-if="inv.status === 'DRAFT'" type="primary" @click="submit">提交审核</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const attrMap: Record<string, string> = {
  str: '力量', con: '体质', siz: '体型', dex: '敏捷',
  app: '外貌', int: '智力', pow: '意志', edu: '教育',
}

const route = useRoute()
const message = useMessage()
const inv = ref<any>(null)

onMounted(async () => {
  const res = await api.get(`/investigators/${route.params.id}`)
  inv.value = res.data
})

async function submit() {
  try {
    await api.post(`/investigators/${inv.value.id}/submit`)
    message.success('已提交审核')
    inv.value.status = 'PENDING'
  } catch (e: any) {
    message.error(e.response?.data?.message || '提交失败')
  }
}

function statusType(status: string) {
  const map: Record<string, string> = { DRAFT: 'default', PENDING: 'warning', APPROVED: 'success', ARCHIVED: 'error' }
  return map[status] || 'default'
}
function statusText(status: string) {
  const map: Record<string, string> = { DRAFT: '草稿', PENDING: '待审核', APPROVED: '已通过', ARCHIVED: '已归档' }
  return map[status] || status
}
</script>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.attr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.attr-box { background: #f9f9f5; padding: 1rem; border-radius: 8px; text-align: center; }
.attr-box label { display: block; font-size: 0.8rem; color: #999; margin-bottom: 0.25rem; }
.attr-box span { font-size: 1.5rem; font-weight: bold; color: #8B4513; }
.derived { display: flex; gap: 1.5rem; background: #fff8f0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
.story h4 { color: #8B4513; margin-bottom: 0.5rem; }
.story p { color: #555; line-height: 1.6; margin-bottom: 1rem; }
.actions { margin-top: 1.5rem; }
</style>
