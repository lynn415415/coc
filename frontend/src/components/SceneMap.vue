<template>
  <div class="scene-map-panel">
    <div class="map-header">
      <n-select
        v-model:value="selectedSceneId"
        :options="sceneOptions"
        placeholder="选择场景"
        size="small"
      />
      <n-space size="small">
        <n-tag v-if="viewMode === 'kp'" type="warning" size="small">KP视角</n-tag>
        <n-tag v-else type="info" size="small">玩家视角</n-tag>
        <n-button v-if="isKp" size="tiny" @click="viewMode = viewMode === 'kp' ? 'player' : 'kp'">
          {{ viewMode === 'kp' ? '玩家视角' : 'KP视角' }}
        </n-button>
      </n-space>
    </div>

    <div class="map-area">
      <MapCanvas
        v-if="selectedSceneId"
        :scene-id="selectedSceneId"
        :tokens="sceneTokens"
        :fog-data="fogData"
        :mode="viewMode"
        :background-image="backgroundImage"
        @token-move="onTokenMove"
        @token-add="onTokenAdd"
        @token-delete="onTokenDelete"
        @token-select="onTokenSelect"
        @fog-update="onFogUpdate"
        @background-change="onBackgroundChange"
      />
      <n-empty v-else description="选择场景以查看地图" class="map-placeholder" />
    </div>

    <div v-if="selectedSceneId && isKp" class="token-list">
      <div class="token-list-header">
        <span>Token 列表 ({{ sceneTokens.length }})</span>
      </div>
      <div v-if="!sceneTokens.length" class="token-empty">暂无Token，点击地图添加</div>
      <div v-for="t in sceneTokens" :key="t.id" class="token-row" :class="{ active: selectedTokenId === t.id }" @click="onTokenSelect(t.id)">
        <span class="token-faction" :class="t.faction"></span>
        <span class="token-name">{{ t.name }}</span>
        <span class="token-pos">{{ Math.round(t.x) }}, {{ Math.round(t.y) }}</span>
        <n-switch size="small" :value="!t.isHidden" @update:value="(v: boolean) => onToggleHidden(t.id, !v)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import api from '@/api/client'
import MapCanvas from './MapCanvas.vue'

const props = defineProps<{
  campaignId: string
  scenes: any[]
  isKp: boolean
  currentSceneId: string | null
}>()

const message = useMessage()
const selectedSceneId = ref<string>('')
const viewMode = ref<'kp' | 'player'>('kp')
const sceneTokens = ref<any[]>([])
const fogData = ref<any>(null)
const backgroundImage = ref<string | null>(null)
const selectedTokenId = ref<string | null>(null)

const sceneOptions = computed(() =>
  props.scenes.map((s: any) => ({ label: s.name, value: s.id }))
)

async function loadTokens() {
  if (!selectedSceneId.value) return
  try {
    const res = await api.get(`/scenes/${selectedSceneId.value}/tokens`)
    sceneTokens.value = res.data || []
  } catch { sceneTokens.value = [] }
}

async function loadFog() {
  if (!selectedSceneId.value) return
  try {
    const res = await api.get(`/scenes/${selectedSceneId.value}/fog`)
    fogData.value = res.data
  } catch { fogData.value = null }
}

async function loadScene() {
  if (!selectedSceneId.value) return
  try {
    const res = await api.get(`/scenes/${selectedSceneId.value}`)
    backgroundImage.value = res.data?.backgroundImage || null
  } catch { backgroundImage.value = null }
}

async function onTokenMove(payload: { id: string; x: number; y: number }) {
  try {
    await api.patch(`/scenes/${selectedSceneId.value}/tokens/${payload.id}`, { x: payload.x, y: payload.y })
  } catch { /* silent */ }
}

async function onTokenAdd(payload: { name: string; x: number; y: number; faction: string }) {
  try {
    await api.post(`/scenes/${selectedSceneId.value}/tokens`, payload)
    await loadTokens()
    message.success(`Token "${payload.name}" 已添加`)
  } catch (e: any) {
    message.error(e.response?.data?.message || '添加失败')
  }
}

async function onTokenDelete(id: string) {
  try {
    await api.delete(`/scenes/${selectedSceneId.value}/tokens/${id}`)
    await loadTokens()
    message.success('Token已删除')
  } catch (e: any) {
    message.error(e.response?.data?.message || '删除失败')
  }
}

function onTokenSelect(id: string | null) {
  selectedTokenId.value = id
}

async function onToggleHidden(id: string, isHidden: boolean) {
  try {
    await api.patch(`/scenes/${selectedSceneId.value}/tokens/${id}`, { isHidden })
    await loadTokens()
  } catch {}
}

async function onFogUpdate(payload: { gmPaths: any; revealedRegions: any }) {
  try {
    await api.put(`/scenes/${selectedSceneId.value}/fog`, payload)
  } catch {}
}

async function onBackgroundChange(url: string) {
  try {
    await api.patch(`/scenes/${selectedSceneId.value}`, { backgroundImage: url })
    backgroundImage.value = url
  } catch {}
}

watch(selectedSceneId, () => {
  loadTokens()
  loadFog()
  loadScene()
})

watch(() => props.currentSceneId, (val) => {
  if (val) selectedSceneId.value = val
})

onMounted(() => {
  if (props.currentSceneId) selectedSceneId.value = props.currentSceneId
  else if (props.scenes.length) selectedSceneId.value = props.scenes[0].id
})
</script>

<style scoped>
.scene-map-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
}
.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid #2a2a3e;
}
.map-area {
  flex: 1;
  min-height: 0;
  position: relative;
}
.map-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.token-list {
  border-top: 1px solid #2a2a3e;
  max-height: 150px;
  overflow-y: auto;
}
.token-list-header {
  padding: 6px 8px;
  font-size: 12px;
  color: #888;
  border-bottom: 1px solid #2a2a3e;
}
.token-empty {
  padding: 12px 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
.token-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 1px solid #222;
}
.token-row:hover { background: #2a2a3e; }
.token-row.active { background: #3a3a5e; }
.token-faction {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.token-faction.enemy { background: #c0392b; }
.token-faction.ally { background: #27ae60; }
.token-faction.neutral { background: #3498db; }
.token-faction.player { background: #f1c40f; }
.token-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.token-pos { color: #666; font-size: 10px; }
</style>
