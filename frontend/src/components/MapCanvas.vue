<template>
  <div class="map-canvas-wrap" ref="wrapRef">
    <canvas ref="canvasRef"></canvas>
    <div v-if="mode === 'kp'" class="map-toolbar">
      <n-space size="small">
        <n-button size="tiny" :type="tool === 'select' ? 'primary' : 'default'" @click="tool = 'select'">选择</n-button>
        <n-button size="tiny" :type="tool === 'token' ? 'primary' : 'default'" @click="tool = 'token'">+Token</n-button>
        <n-button size="tiny" :type="tool === 'fog' ? 'primary' : 'default'" @click="tool = 'fog'">迷雾</n-button>
        <n-button size="tiny" :type="tool === 'erase_fog' ? 'primary' : 'default'" @click="tool = 'erase_fog'">擦除迷雾</n-button>
        <n-button size="tiny" @click="toggleGrid">网格</n-button>
        <n-button size="tiny" @click="uploadBg">背景</n-button>
        <n-button size="tiny" type="error" ghost :disabled="!selectedTokenId" @click="deleteSelected">删除</n-button>
      </n-space>
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onBgFile" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { Canvas, Rect, Text, Group, Image, Line, Circle, Path } from 'fabric'

const props = defineProps<{
  sceneId: string
  tokens: any[]
  fogData: any
  mode: 'kp' | 'player'
  backgroundImage: string | null
}>()

const emit = defineEmits<{
  'token-move': [payload: { id: string; x: number; y: number }]
  'token-add': [payload: { name: string; x: number; y: number; faction: string }]
  'token-delete': [id: string]
  'token-select': [id: string | null]
  'fog-update': [payload: { gmPaths: any; revealedRegions: any }]
  'background-change': [url: string]
}>()

const message = useMessage()
const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const tool = ref<'select' | 'token' | 'fog' | 'erase_fog'>('select')
const selectedTokenId = ref<string | null>(null)
const showGrid = ref(false)

let fabricCanvas: Canvas | null = null
let fogGroup: Group | null = null
let gridGroup: Group | null = null
let bgImage: Image | null = null

function initCanvas() {
  if (!canvasRef.value) return
  const wrap = wrapRef.value
  if (!wrap) return

  const w = wrap.clientWidth
  const h = wrap.clientHeight - (props.mode === 'kp' ? 40 : 0)

  fabricCanvas = new Canvas(canvasRef.value, {
    width: w,
    height: h,
    backgroundColor: '#1a1a1a',
    selection: props.mode === 'kp',
  })

  fabricCanvas.on('object:modified', (e: any) => {
    const obj = e.target
    if (!obj || !(obj as any).tokenId) return
    const center = obj.getCenterPoint()
    emit('token-move', { id: (obj as any).tokenId, x: Math.round(center.x), y: Math.round(center.y) })
  })

  fabricCanvas.on('selection:created', (e: any) => {
    const obj = e.selected?.[0]
    if (obj && (obj as any).tokenId) {
      selectedTokenId.value = (obj as any).tokenId
      emit('token-select', (obj as any).tokenId)
    }
  })

  fabricCanvas.on('selection:cleared', () => {
    selectedTokenId.value = null
    emit('token-select', null)
  })

  fabricCanvas.on('mouse:down', (opt: any) => {
    if (!fabricCanvas) return
    const pointer = fabricCanvas.getScenePoint(opt.e)

    if (tool.value === 'token' && props.mode === 'kp') {
      const name = window.prompt('Token名称:')
      if (!name) return
      emit('token-add', { name, x: pointer.x, y: pointer.y, faction: 'neutral' })
      tool.value = 'select'
    }

    if (tool.value === 'fog' || tool.value === 'erase_fog') {
      fabricCanvas.isDrawingMode = true
      const brush = fabricCanvas.freeDrawingBrush
      if (brush) {
        brush.width = tool.value === 'erase_fog' ? 40 : 30
        brush.color = tool.value === 'erase_fog' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.85)'
      }
    }
  })

  fabricCanvas.on('mouse:up', () => {
    if (fabricCanvas && fabricCanvas.isDrawingMode) {
      fabricCanvas.isDrawingMode = false
      saveFogPaths()
    }
  })
}

function fitCanvas() {
  if (!fabricCanvas || !wrapRef.value) return
  const w = wrapRef.value.clientWidth
  const h = wrapRef.value.clientHeight - (props.mode === 'kp' ? 40 : 0)
  fabricCanvas.setWidth(w)
  fabricCanvas.setHeight(h)
  fabricCanvas.renderAll()
}

function renderTokens() {
  if (!fabricCanvas) return

  const oldTokens = fabricCanvas.getObjects().filter((o: any) => (o as any).tokenId)
  oldTokens.forEach((o: any) => fabricCanvas!.remove(o))

  props.tokens.forEach((t) => {
    if (props.mode === 'player' && t.isHidden) return

    const fill = t.faction === 'enemy' ? '#c0392b' : t.faction === 'ally' ? '#27ae60' : '#3498db'

    const rect = new Rect({
      left: t.x - (t.width || 40) / 2,
      top: t.y - (t.height || 40) / 2,
      width: t.width || 40,
      height: t.height || 40,
      fill,
      rx: 4,
      ry: 4,
      stroke: '#fff',
      strokeWidth: 1,
      selectable: props.mode === 'kp',
      evented: props.mode === 'kp',
    })

    const label = new Text(t.name.slice(0, 4), {
      left: t.x - 16,
      top: t.y - 8,
      fontSize: 12,
      fill: '#fff',
      selectable: false,
      evented: false,
    })

    const group = new Group([rect, label], {
      left: t.x - (t.width || 40) / 2,
      top: t.y - (t.height || 40) / 2,
      subTargetCheck: true,
    }) as any
    group.tokenId = t.id

    fabricCanvas!.add(group)
  })

  fabricCanvas.renderAll()
}

function renderFog() {
  if (!fabricCanvas || !props.fogData) return

  if (fogGroup) {
    fabricCanvas.remove(fogGroup)
    fogGroup = null
  }

  if (props.mode === 'kp') {
    const paths = props.fogData.gmPaths || []
    const objects: any[] = []

    paths.forEach((p: any) => {
      try {
        const obj = new Path(p.path, {
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
        })
        objects.push(obj)
      } catch {}
    })

    if (objects.length) {
      fogGroup = new Group(objects, { selectable: false })
      fabricCanvas.add(fogGroup)
    }
  } else {
    const revealed = props.fogData.revealedRegions || []
    const w = fabricCanvas.getWidth()
    const h = fabricCanvas.getHeight()

    const fullFog = new Rect({
      left: 0, top: 0,
      width: w, height: h,
      fill: 'rgba(0,0,0,0.9)',
      selectable: false,
      evented: false,
    })

    if (revealed.length) {
      const clipObjects: any[] = [fullFog]
      revealed.forEach((r: any) => {
        try {
          const hole = new Circle({
            left: r.x - r.r,
            top: r.y - r.r,
            radius: r.r,
            fill: 'transparent',
            absolutePositioned: true,
          })
          clipObjects.push(hole)
        } catch {}
      })
      fogGroup = new Group(clipObjects, { selectable: false })
    } else {
      fogGroup = new Group([fullFog], { selectable: false })
    }
    fabricCanvas.add(fogGroup)
  }

  fabricCanvas.renderAll()
}

function renderGrid() {
  if (!fabricCanvas) return
  if (gridGroup) { fabricCanvas.remove(gridGroup); gridGroup = null }

  if (!showGrid.value) { fabricCanvas.renderAll(); return }

  const w = fabricCanvas.getWidth()
  const h = fabricCanvas.getHeight()
  const gridSize = 50
  const lines: any[] = []

  for (let x = 0; x <= w; x += gridSize) {
    lines.push(new Line([x, 0, x, h], { stroke: 'rgba(255,255,255,0.1)', selectable: false, evented: false }))
  }
  for (let y = 0; y <= h; y += gridSize) {
    lines.push(new Line([0, y, w, y], { stroke: 'rgba(255,255,255,0.1)', selectable: false, evented: false }))
  }

  gridGroup = new Group(lines, { selectable: false })
  fabricCanvas.add(gridGroup)
  fabricCanvas.renderAll()
}

function saveFogPaths() {
  if (!fabricCanvas) return
  const paths: any[] = []
  const objects = fabricCanvas.getObjects()
  objects.forEach((o: any) => {
    if (o.type === 'path' && o.fill === 'rgba(0,0,0,0.5)') {
      paths.push({ path: o.path?.join('') || '' })
    }
  })
  emit('fog-update', { gmPaths: paths, revealedRegions: props.fogData?.revealedRegions || [] })
}

function loadBackground(url: string) {
  if (!fabricCanvas) return
  Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
    if (bgImage) fabricCanvas!.remove(bgImage)
    img.set({
      selectable: false,
      evented: false,
    })
    fabricCanvas!.add(img)
    fabricCanvas!.sendObjectToBack(img)
    bgImage = img
    fabricCanvas!.renderAll()
  }).catch(() => {
    message.error('背景图片加载失败')
  })
}

function uploadBg() { fileInput.value?.click() }
function onBgFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const url = reader.result as string
    emit('background-change', url)
    loadBackground(url)
  }
  reader.readAsDataURL(file)
}

function toggleGrid() { showGrid.value = !showGrid.value; renderGrid() }
function deleteSelected() {
  if (selectedTokenId.value) {
    emit('token-delete', selectedTokenId.value)
    selectedTokenId.value = null
  }
}

watch(() => props.sceneId, () => {
  nextTick(() => {
    if (fabricCanvas) fabricCanvas.dispose()
    initCanvas()
    renderTokens()
    renderFog()
    renderGrid()
    if (props.backgroundImage) loadBackground(props.backgroundImage)
  })
})
watch(() => props.tokens, () => { nextTick(renderTokens) }, { deep: true })
watch(() => props.fogData, () => { nextTick(renderFog) }, { deep: true })
watch(() => props.backgroundImage, (url) => { if (url) loadBackground(url) })
watch(() => props.mode, () => {
  nextTick(() => {
    if (fabricCanvas) fabricCanvas.dispose()
    initCanvas()
    renderTokens()
    renderFog()
    renderGrid()
    if (props.backgroundImage) loadBackground(props.backgroundImage)
  })
})

onMounted(() => {
  nextTick(() => {
    initCanvas()
    renderTokens()
    renderFog()
    renderGrid()
    if (props.backgroundImage) loadBackground(props.backgroundImage)
  })
  window.addEventListener('resize', fitCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', fitCanvas)
  if (fabricCanvas) fabricCanvas.dispose()
})
</script>

<style scoped>
.map-canvas-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #111;
  display: flex;
  flex-direction: column;
}
.map-canvas-wrap canvas {
  flex: 1;
}
.map-toolbar {
  padding: 4px 8px;
  background: #2a2a3e;
  border-top: 1px solid #3a3a5e;
  flex-shrink: 0;
}
</style>
