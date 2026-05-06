<template>
  <div v-if="combat" class="combat-tracker">
    <!-- 顶部栏 -->
    <div class="combat-header">
      <div class="header-left">
        <span class="round-badge">第 {{ combat.roundNumber }} 轮</span>
        <span class="turn-count">{{ combat.turnIndex + 1 }}/{{ combat.combatants.length }}</span>
      </div>
      <div class="header-right">
        <n-button-group size="tiny">
          <n-button type="primary" ghost @click="nextTurn">
            <template #icon><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></template>
            下一回合
          </n-button>
          <n-button type="error" ghost @click="endCombat">
            结束
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- 战斗列表 -->
    <div class="combatant-list">
      <div
        v-for="(c, idx) in combat.combatants"
        :key="c.id"
        class="combatant-row"
        :class="{ current: idx === combat.turnIndex, npc: c.isNpc }"
      >
        <!-- 先攻顺序 -->
        <div class="initiative-col">
          <span class="dex-value">{{ c.initiative }}</span>
          <span class="dex-label">DEX</span>
        </div>

        <!-- 当前回合指示器 -->
        <div class="turn-indicator" :class="{ active: idx === combat.turnIndex }">
          <div class="turn-dot" />
        </div>

        <!-- 名字和血条 -->
        <div class="combatant-main">
          <div class="combatant-name">
            <span v-if="c.isNpc" class="npc-tag">NPC</span>
            {{ c.name }}
          </div>

          <!-- HP条 -->
          <div v-if="c.maxHp" class="hp-bar-wrap">
            <div class="hp-bar" :style="{ width: hpPercent(c) + '%' }" :class="hpColor(c)" />
            <span class="hp-text">{{ c.hp ?? '?' }}/{{ c.maxHp }}</span>
          </div>

          <!-- SAN/MP -->
          <div v-if="c.san != null || c.mp != null" class="secondary-bars">
            <span v-if="c.san != null" class="san-text">SAN {{ c.san }}/{{ c.maxSan }}</span>
            <span v-if="c.mp != null" class="mp-text">MP {{ c.mp }}/{{ c.maxMp }}</span>
          </div>

          <!-- 状态 -->
          <div v-if="c.conditions?.length" class="conditions">
            <n-tag
              v-for="cond in c.conditions"
              :key="cond.id"
              size="tiny"
              :bordered="false"
              :type="cond.modifier && cond.modifier > 0 ? 'success' : cond.modifier && cond.modifier < 0 ? 'error' : 'default'"
            >
              {{ cond.name }}{{ cond.roundsRemaining != null ? ` (${cond.roundsRemaining})` : '' }}
            </n-tag>
          </div>
        </div>

        <!-- HP快捷调整（仅KP） -->
        <div v-if="c.maxHp" class="hp-actions">
          <n-input-number
            v-model:value="c._hpInput"
            size="tiny"
            :min="0"
            :max="c.maxHp"
            style="width: 70px"
            placeholder="HP"
            @blur="updateHp(c, c._hpInput ?? null)"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!combat.combatants?.length" class="empty-state">
      暂无战斗单位
    </div>
  </div>

  <!-- 无战斗轮 -->
  <div v-else class="no-combat">
    <div class="no-combat-text">当前无进行中的战斗</div>
    <n-button size="small" type="primary" @click="$emit('start-combat')">开始战斗轮</n-button>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Combatant {
  id: string
  name: string
  initiative: number
  initiativeRoll: number
  hp: number | null
  maxHp: number | null
  san: number | null
  maxSan: number | null
  mp: number | null
  maxMp: number | null
  isNpc: boolean
  sortOrder: number
  conditions: Condition[]
  _hpInput?: number | null
}

interface Condition {
  id: string
  name: string
  roundsRemaining: number | null
  modifier: number | null
}

interface Combat {
  id: string
  roundNumber: number
  turnIndex: number
  status: string
  combatants: Combatant[]
}

const props = defineProps<{
  combat: Combat | null
  socket?: any
}>()

watch(
  () => props.combat,
  (c) => {
    if (c) {
      c.combatants.forEach((co) => {
        co._hpInput = co.hp
      })
    }
  },
  { immediate: true, deep: true },
)

function hpPercent(c: Combatant) {
  if (!c.maxHp || c.hp == null) return 0
  return Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))
}

function hpColor(c: Combatant) {
  const pct = hpPercent(c)
  if (pct > 66) return 'hp-high'
  if (pct > 33) return 'hp-mid'
  return 'hp-low'
}

function nextTurn() {
  if (!props.socket) return
  props.socket.emit('combat_next_turn')
}

function endCombat() {
  if (!props.socket) return
  props.socket.emit('combat_end')
}

function updateHp(c: Combatant, v: number | null) {
  if (!props.socket || v == null || c.hp == null) return
  const delta = v - c.hp
  if (delta === 0) return
  props.socket.emit('combat_update_hp', {
    combatantId: c.id,
    hp: v,
    delta,
  })
}
</script>

<style scoped>
.combat-tracker {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
}
.combat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #2a2a3e;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.round-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e0e0e8;
}
.turn-count {
  font-size: 0.7rem;
  color: #666;
}
.combatant-list {
  flex: 1;
  overflow-y: auto;
}
.combatant-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.2s;
}
.combatant-row.current {
  background: rgba(240, 160, 32, 0.12);
  border-left: 3px solid #f0a020;
  box-shadow: inset 4px 0 12px rgba(240, 160, 32, 0.15);
}
.initiative-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex-shrink: 0;
}
.dex-value {
  font-size: 1rem;
  font-weight: 700;
  color: #e0e0e8;
  font-family: monospace;
}
.dex-label {
  font-size: 0.6rem;
  color: #555;
  text-transform: uppercase;
}
.turn-indicator {
  width: 8px;
  flex-shrink: 0;
}
.turn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.3s;
}
.turn-indicator.active .turn-dot {
  background: #f0a020;
  box-shadow: 0 0 6px rgba(240, 160, 32, 0.6);
}
.combatant-main {
  flex: 1;
  min-width: 0;
}
.combatant-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #d0d0d8;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.npc-tag {
  font-size: 0.6rem;
  padding: 0 0.3rem;
  border-radius: 3px;
  background: #2a2a3e;
  color: #888;
}
.hp-bar-wrap {
  position: relative;
  height: 14px;
  background: #2a2a3e;
  border-radius: 7px;
  margin-top: 3px;
  overflow: hidden;
}
.hp-bar {
  height: 100%;
  border-radius: 7px;
  transition: width 0.3s ease;
}
.hp-bar.hp-high { background: #4ade80; }
.hp-bar.hp-mid { background: #facc15; }
.hp-bar.hp-low { background: #ef4444; }
.hp-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.65rem;
  color: #fff;
  line-height: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.secondary-bars {
  display: flex;
  gap: 0.75rem;
  margin-top: 2px;
}
.san-text, .mp-text {
  font-size: 0.65rem;
  color: #666;
  font-family: monospace;
}
.conditions {
  display: flex;
  gap: 0.25rem;
  margin-top: 3px;
  flex-wrap: wrap;
}
.hp-actions {
  flex-shrink: 0;
  margin-left: auto;
}
.no-combat {
  padding: 2rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}
.no-combat-text {
  font-size: 0.8rem;
  color: #555;
}
.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #555;
  font-size: 0.8rem;
}
</style>
