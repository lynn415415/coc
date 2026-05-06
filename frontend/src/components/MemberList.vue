<template>
  <div class="member-list">
    <!-- KP 区域 -->
    <div class="section">
      <div class="section-title">KP</div>
      <div v-if="kpMember" class="member-item kp-item">
        <div class="avatar kp-avatar">{{ (kpMember.username)[0] }}</div>
        <div class="member-info">
          <span class="member-name">{{ kpMember.username }}</span>
          <span class="member-role">守秘人</span>
        </div>
        <span class="status-dot" :class="kpMember.status || 'online'" />
      </div>
    </div>

    <!-- 调查员区域 -->
    <div class="section">
      <div class="section-title">调查员 ({{ playerMembers.length }})</div>
      <div
        v-for="m in playerMembers"
        :key="m.userId"
        class="member-item"
        :class="{ offline: m.status === 'offline' }"
      >
        <div class="avatar" :class="m.investigator ? 'has-char' : 'no-char'">
          {{ m.investigator ? m.investigator.name[0] : m.username[0] }}
        </div>
        <div class="member-info">
          <span class="member-name">{{ m.investigator?.name || '未绑定角色卡' }}</span>
          <span class="member-user">{{ m.username }}</span>
          <div v-if="m.investigator" class="stat-bars">
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <n-progress type="line" :percentage="hpPct(m.investigator)" :show-indicator="false" :height="4" :color="'#d9534f'" />
              <span class="bar-num">{{ m.investigator.hp }}/{{ m.investigator.maxHp }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">SAN</span>
              <n-progress type="line" :percentage="sanPct(m.investigator)" :show-indicator="false" :height="4" :color="'#5bc0de'" />
              <span class="bar-num">{{ m.investigator.san }}/{{ m.investigator.maxSan }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">MP</span>
              <n-progress type="line" :percentage="mpPct(m.investigator)" :show-indicator="false" :height="4" :color="'#5cb85c'" />
              <span class="bar-num">{{ m.investigator.mp }}/{{ m.investigator.maxMp }}</span>
            </div>
          </div>
        </div>
        <div class="member-actions">
          <n-button v-if="m.investigator" text size="tiny" @click="$emit('view-investigator', m.investigator.id)">
            查看
          </n-button>
          <n-button v-if="isKp && m.userId !== kpId" text size="tiny" type="error" @click="$emit('kick', m.userId)">
            踢出
          </n-button>
        </div>
        <span class="status-dot" :class="m.status || 'online'" />
      </div>
      <n-empty v-if="!playerMembers.length" description="暂无调查员" size="small" />
    </div>

    <!-- 待审核区域（仅KP可见） -->
    <div v-if="isKp && pendingMembers.length" class="section">
      <div class="section-title">待审核 ({{ pendingMembers.length }})</div>
      <div v-for="m in pendingMembers" :key="m.userId" class="member-item pending-item">
        <div class="avatar pending-avatar">{{ m.username[0] }}</div>
        <div class="member-info">
          <span class="member-name">{{ m.username }}</span>
          <span class="member-user">等待审核</span>
        </div>
        <div class="member-actions">
          <n-button size="tiny" type="primary" @click="$emit('approve', m.userId)">通过</n-button>
          <n-button size="tiny" type="error" ghost @click="$emit('kick', m.userId)">拒绝</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Member {
  userId: string
  username: string
  status?: string
  role?: string
  investigator?: {
    id: string
    name: string
    hp: number
    maxHp: number
    san: number
    maxSan: number
    mp: number
    maxMp: number
  }
}

const props = defineProps<{
  members: Member[]
  isKp: boolean
  kpId: string
}>()

defineEmits<{
  (e: 'view-investigator', id: string): void
  (e: 'kick', userId: string): void
  (e: 'approve', userId: string): void
}>()

const kpMember = computed(() => props.members.find(m => m.userId === props.kpId))
const playerMembers = computed(() => props.members.filter(m => m.userId !== props.kpId && m.status !== 'PENDING'))
const pendingMembers = computed(() => props.members.filter(m => m.status === 'PENDING'))

function hpPct(inv: any) {
  return inv.maxHp ? Math.round((inv.hp / inv.maxHp) * 100) : 0
}
function sanPct(inv: any) {
  return inv.maxSan ? Math.round((inv.san / inv.maxSan) * 100) : 0
}
function mpPct(inv: any) {
  return inv.maxMp ? Math.round((inv.mp / inv.maxMp) * 100) : 0
}
</script>

<style scoped>
.member-list { padding: 0.5rem; }
.section { margin-bottom: 0.75rem; }
.section-title {
  font-size: 0.7rem; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0.4rem 0.5rem; border-bottom: 1px solid #2a2a3e;
  margin-bottom: 0.25rem;
}
.member-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem; border-radius: 6px;
  transition: background 0.15s;
}
.member-item:hover { background: rgba(255,255,255,0.04); }
.member-item.offline { opacity: 0.5; }
.member-item.pending-item { background: rgba(250,200,50,0.08); }

.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 600; flex-shrink: 0;
  background: #3a3a5e; color: #c0c0c8;
}
.avatar.kp-avatar { background: #8B4513; color: #fff; }
.avatar.has-char { background: #2a4a6e; color: #7cb8e8; }
.avatar.pending-avatar { background: #4a4a2e; color: #f0c040; }

.member-info { flex: 1; min-width: 0; }
.member-name { display: block; font-size: 0.85rem; color: #e0e0e8; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-user { display: block; font-size: 0.7rem; color: #666; }
.member-role { display: block; font-size: 0.7rem; color: #c49a6c; }

.stat-bars { margin-top: 0.3rem; }
.bar-row { display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.15rem; }
.bar-label { width: 24px; font-size: 0.65rem; color: #888; }
.bar-num { font-size: 0.6rem; color: #666; width: 36px; text-align: right; }

.member-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }

.status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.status-dot.online { background: #4ade80; box-shadow: 0 0 4px rgba(74, 222, 128, 0.4); }
.status-dot.PENDING { background: #f0a020; }
.status-dot.offline { background: #666; }
</style>
