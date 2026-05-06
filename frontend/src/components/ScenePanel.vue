<template>
  <div class="scene-panel">
    <!-- 当前场景 -->
    <div class="current-scene" @click="expanded = !expanded">
      <div class="scene-header">
        <div class="scene-title">
          <span class="scene-icon">&#127912;</span>
          <span>{{ currentScene?.name || '未选择场景' }}</span>
        </div>
        <svg :class="['arrow', { rotated: expanded }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <p v-if="currentScene?.description" class="scene-desc">{{ currentScene.description }}</p>
    </div>

    <!-- 展开：场景列表 + 线索 -->
    <transition name="slide">
      <div v-if="expanded" class="scene-detail">
        <!-- 场景切换 -->
        <div class="scene-list">
          <div class="scene-list-header">
            <span>全部场景 ({{ scenes.length }})</span>
            <n-button v-if="isKp" size="tiny" type="primary" @click="openCreateScene">+ 新建</n-button>
          </div>
          <div
            v-for="s in scenes"
            :key="s.id"
            class="scene-item"
            :class="{ active: s.id === selectedSceneId }"
            @click="selectScene(s)"
          >
            <div class="scene-item-info" @click="selectScene(s)">
              <span class="scene-item-name">{{ s.name }}</span>
              <span class="scene-item-desc">{{ s.description || '无描述' }}</span>
            </div>
            <div v-if="isKp" class="scene-item-actions">
              <n-button v-if="s.id !== currentScene?.id" size="tiny" type="primary" @click.stop="activateScene(s)">切换</n-button>
              <n-button text size="tiny" @click.stop="editScene(s)">&#9998;</n-button>
              <n-button text size="tiny" type="error" @click.stop="deleteScene(s)">&#10005;</n-button>
            </div>
            <n-tag v-if="s.id === currentScene?.id" size="tiny" type="success">当前</n-tag>
          </div>
          <n-empty v-if="!scenes.length" description="暂无场景" size="small" />
        </div>

        <!-- 选中场景的详情 + 线索 -->
        <div v-if="selectedScene" class="scene-clues">
          <div class="clues-header">
            <span>关联线索 ({{ sceneClues.length }})</span>
            <n-button v-if="isKp" size="tiny" @click="openAddClue">+ 关联线索</n-button>
          </div>
          <div v-for="clue in sceneClues" :key="clue.id" class="clue-item">
            <div class="clue-main">
              <span class="clue-title">{{ clue.title }}</span>
              <span class="clue-content">{{ clue.content }}</span>
              <div v-if="clue.triggerCondition" class="clue-trigger">
                <span class="trigger-label">触发条件:</span>
                <span class="trigger-text">{{ clue.triggerCondition }}</span>
              </div>
            </div>
            <div v-if="isKp" class="clue-actions">
              <n-button text size="tiny" @click="editClue(clue)">&#9998;</n-button>
              <n-button text size="tiny" type="error" @click="removeClueFromScene(clue)">&#10005;</n-button>
            </div>
          </div>
          <n-empty v-if="!sceneClues.length" description="暂无线索" size="small" />
        </div>
      </div>
    </transition>

    <!-- 创建/编辑场景弹窗 -->
    <n-modal v-model:show="showSceneModal" :title="editingScene ? '编辑场景' : '新建场景'" preset="card" style="width: 400px">
      <n-form>
        <n-form-item label="场景名称" required>
          <n-input v-model:value="sceneForm.name" placeholder="如：阿卡姆精神病院三楼" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="sceneForm.description" type="textarea" placeholder="场景氛围描述、关键NPC、可交互物品等" :rows="4" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showSceneModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="saveScene">{{ editingScene ? '保存' : '创建' }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 关联线索弹窗 -->
    <n-modal v-model:show="showClueModal" :title="editingClue ? '编辑线索关联' : '关联线索'" preset="card" style="width: 480px">
      <n-form v-if="!editingClue">
        <n-form-item label="选择线索">
          <n-select
            v-model:value="clueForm.clueId"
            :options="availableClues.map(c => ({ label: c.title, value: c.id }))"
            placeholder="选择已有线索"
            filterable
          />
        </n-form-item>
        <n-form-item label="触发条件">
          <n-input v-model:value="clueForm.triggerCondition" type="textarea" placeholder="描述玩家如何发现或触发此线索，如：调查书架时自动发现、与NPC对话后获得" :rows="3" />
        </n-form-item>
      </n-form>
      <n-form v-else>
        <n-form-item label="触发条件">
          <n-input v-model:value="clueForm.triggerCondition" type="textarea" placeholder="描述触发条件" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showClueModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="saveClueRelation">{{ editingClue ? '保存' : '关联' }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import api from '@/api/client'

const props = defineProps<{
  campaignId: string
  scenes: any[]
  currentSceneId: string | null
  isKp: boolean
}>()

const emit = defineEmits<{
  (e: 'scene-switch', sceneId: string): void
  (e: 'scenes-updated'): void
}>()

const message = useMessage()
const dialog = useDialog()
const expanded = ref(false)
const selectedSceneId = ref<string | null>(null)
const sceneClues = ref<any[]>([])
const allClues = ref<any[]>([])

const showSceneModal = ref(false)
const showClueModal = ref(false)
const saving = ref(false)
const editingScene = ref<any>(null)
const editingClue = ref<any>(null)
const sceneForm = ref({ name: '', description: '' })
const clueForm = ref({ clueId: '', triggerCondition: '' })

const currentScene = computed(() =>
  props.scenes.find(s => s.id === props.currentSceneId) || null
)

const selectedScene = computed(() =>
  props.scenes.find(s => s.id === selectedSceneId.value) || null
)

// 未关联到当前场景的线索
const availableClues = computed(() => {
  const linkedIds = new Set(sceneClues.value.map((c: any) => c.id))
  return allClues.value.filter(c => !linkedIds.has(c.id))
})

async function loadSceneClues(sceneId: string) {
  try {
    const res = await api.get(`/campaigns/${props.campaignId}/clues`, { params: { sceneId } })
    sceneClues.value = res.data || []
  } catch {
    sceneClues.value = []
  }
}

async function loadAllClues() {
  try {
    const res = await api.get(`/campaigns/${props.campaignId}/clues`)
    allClues.value = res.data || []
  } catch {
    allClues.value = []
  }
}

function selectScene(scene: any) {
  selectedSceneId.value = scene.id
  loadSceneClues(scene.id)
}

async function activateScene(scene: any) {
  if (scene.id === props.currentSceneId) return
  if (!props.isKp) return
  try {
    await api.post(`/campaigns/${props.campaignId}/switch-scene/${scene.id}`)
    emit('scene-switch', scene.id)
    message.success(`已切换至：${scene.name}`)
  } catch (e: any) {
    message.error(e.response?.data?.message || '切换失败')
  }
}

function openCreateScene() {
  editingScene.value = null
  sceneForm.value = { name: '', description: '' }
  showSceneModal.value = true
}

function editScene(scene: any) {
  editingScene.value = scene
  sceneForm.value = { name: scene.name, description: scene.description || '' }
  showSceneModal.value = true
}

async function saveScene() {
  if (!sceneForm.value.name.trim()) {
    message.error('请输入场景名称')
    return
  }
  saving.value = true
  try {
    if (editingScene.value) {
      await api.patch(`/scenes/${editingScene.value.id}`, sceneForm.value)
      message.success('场景已更新')
    } else {
      await api.post(`/campaigns/${props.campaignId}/scenes`, sceneForm.value)
      message.success('场景已创建')
    }
    showSceneModal.value = false
    editingScene.value = null
    sceneForm.value = { name: '', description: '' }
    emit('scenes-updated')
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  } finally {
    saving.value = false
  }
}

function deleteScene(scene: any) {
  dialog.warning({
    title: '删除场景',
    content: `确定删除「${scene.name}」吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.delete(`/scenes/${scene.id}`)
        message.success('已删除')
        emit('scenes-updated')
      } catch (e: any) {
        message.error(e.response?.data?.message || '删除失败')
      }
    },
  })
}

function openAddClue() {
  editingClue.value = null
  clueForm.value = { clueId: '', triggerCondition: '' }
  loadAllClues()
  showClueModal.value = true
}

function editClue(clue: any) {
  editingClue.value = clue
  clueForm.value = { clueId: clue.id, triggerCondition: clue.triggerCondition || '' }
  showClueModal.value = true
}

async function saveClueRelation() {
  saving.value = true
  try {
    if (editingClue.value) {
      // 更新触发条件
      await api.patch(`/campaigns/${props.campaignId}/clues/${editingClue.value.id}`, {
        triggerCondition: clueForm.value.triggerCondition,
      })
      message.success('已更新')
    } else {
      // 关联线索到场景
      if (!clueForm.value.clueId) {
        message.error('请选择线索')
        return
      }
      await api.patch(`/campaigns/${props.campaignId}/clues/${clueForm.value.clueId}`, {
        sceneId: selectedSceneId.value,
        triggerCondition: clueForm.value.triggerCondition,
      })
      message.success('已关联')
    }
    showClueModal.value = false
    if (selectedSceneId.value) loadSceneClues(selectedSceneId.value)
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function removeClueFromScene(clue: any) {
  dialog.warning({
    title: '取消关联',
    content: `确定将「${clue.title}」从当前场景移除吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.patch(`/campaigns/${props.campaignId}/clues/${clue.id}`, {
          sceneId: null,
          triggerCondition: null,
        })
        message.success('已移除')
        if (selectedSceneId.value) loadSceneClues(selectedSceneId.value)
      } catch (e: any) {
        message.error(e.response?.data?.message || '操作失败')
      }
    },
  })
}

// 默认选中当前场景并加载线索
watch(() => props.currentSceneId, (id) => {
  if (id && !selectedSceneId.value) {
    selectedSceneId.value = id
    loadSceneClues(id)
  }
}, { immediate: true })
</script>

<style scoped>
.scene-panel {
  background: #1e1e32;
  border-bottom: 1px solid #2a2a3e;
}
.current-scene {
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.current-scene:hover { background: rgba(255,255,255,0.03); }
.scene-header {
  display: flex; align-items: center; justify-content: space-between;
}
.scene-title {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.9rem; font-weight: 600; color: #e0e0e8;
}
.scene-icon { font-size: 1rem; }
.arrow { color: #666; transition: transform 0.2s; }
.arrow.rotated { transform: rotate(180deg); }
.scene-desc {
  font-size: 0.75rem; color: #888; margin: 0.3rem 0 0;
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.scene-detail {
  border-top: 1px solid #2a2a3e;
  max-height: 400px; overflow-y: auto;
}
.scene-list-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.75rem; color: #888;
  border-bottom: 1px solid #222;
}
.scene-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #1a1a2e;
  cursor: pointer;
  transition: background 0.15s;
}
.scene-item:hover { background: rgba(255,255,255,0.04); }
.scene-item.active { background: rgba(74, 222, 128, 0.08); }
.scene-item-info { flex: 1; min-width: 0; }
.scene-item-name { display: block; font-size: 0.85rem; color: #e0e0e8; }
.scene-item-desc {
  display: block; font-size: 0.7rem; color: #666;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.scene-item-actions { display: flex; gap: 0.25rem; }

.scene-clues {
  border-top: 2px solid #2a2a3e;
  padding: 0.5rem 0;
}
.clues-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.4rem 1rem;
  font-size: 0.75rem; color: #888;
}
.clue-item {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #1a1a2e;
}
.clue-main { flex: 1; min-width: 0; }
.clue-title { display: block; font-size: 0.85rem; color: #e0e0e8; font-weight: 500; }
.clue-content {
  display: block; font-size: 0.75rem; color: #888; margin-top: 0.15rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.clue-trigger {
  margin-top: 0.3rem; padding: 0.3rem 0.5rem;
  background: rgba(196, 154, 108, 0.1); border-radius: 4px;
  border-left: 2px solid #c49a6c;
}
.trigger-label { font-size: 0.65rem; color: #c49a6c; font-weight: 600; }
.trigger-text { font-size: 0.75rem; color: #a0a0a8; margin-left: 0.3rem; }
.clue-actions { display: flex; gap: 0.25rem; flex-shrink: 0; padding-top: 0.2rem; }

.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
.slide-enter-to, .slide-leave-from { max-height: 400px; }
</style>
