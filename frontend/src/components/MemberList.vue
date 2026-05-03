<template>
  <div class="member-list">
    <h4>在线成员</h4>
    <div v-for="m in members" :key="m.userId" class="member-item">
      <div class="member-name">{{ m.username }}</div>
      <div v-if="m.investigator" class="investigator-mini">
        <div class="bar-row">
          <span class="bar-label">HP</span>
          <n-progress type="line" :percentage="hpPct(m.investigator)" :show-indicator="false" :height="4" :color="'#d9534f'" />
        </div>
        <div class="bar-row">
          <span class="bar-label">SAN</span>
          <n-progress type="line" :percentage="sanPct(m.investigator)" :show-indicator="false" :height="4" :color="'#5bc0de'" />
        </div>
        <div class="bar-row">
          <span class="bar-label">MP</span>
          <n-progress type="line" :percentage="mpPct(m.investigator)" :show-indicator="false" :height="4" :color="'#5cb85c'" />
        </div>
      </div>
    </div>
    <n-empty v-if="!members.length" description="暂无成员在线" />
  </div>
</template>

<script setup lang="ts">
interface Member {
  userId: string;
  username: string;
  investigator?: {
    hp: number;
    maxHp: number;
    san: number;
    maxSan: number;
    mp: number;
    maxMp: number;
  };
}

defineProps<{ members: Member[] }>();

function hpPct(inv: any) {
  if (!inv.maxHp) return 0;
  return Math.round((inv.hp / inv.maxHp) * 100);
}
function sanPct(inv: any) {
  if (!inv.maxSan) return 0;
  return Math.round((inv.san / inv.maxSan) * 100);
}
function mpPct(inv: any) {
  if (!inv.maxMp) return 0;
  return Math.round((inv.mp / inv.maxMp) * 100);
}
</script>

<style scoped>
.member-list { padding: 0.75rem; }
h4 { margin-bottom: 0.75rem; font-size: 0.9rem; color: #333; }
.member-item { padding: 0.6rem 0; border-bottom: 1px solid #f0f0ec; }
.member-name { font-weight: 500; font-size: 0.9rem; margin-bottom: 0.3rem; }
.investigator-mini { font-size: 0.75rem; }
.bar-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.15rem; }
.bar-label { width: 24px; color: #888; }
</style>
