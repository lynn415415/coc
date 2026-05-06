<template>
  <div class="relation-graph" ref="containerRef">
    <div class="graph-toolbar">
      <n-button size="tiny" @click="refresh">刷新</n-button>
      <span class="node-count">{{ nodes.length }} 节点 / {{ edges.length }} 关系</span>
    </div>
    <svg ref="svgRef" class="graph-canvas" :viewBox="`0 0 ${width} ${height}`">
      <!-- 边 -->
      <g class="edges">
        <line
          v-for="edge in edges"
          :key="edge.id"
          :x1="edge.x1" :y1="edge.y1"
          :x2="edge.x2" :y2="edge.y2"
          class="edge-line"
          :class="`edge-${edge.relationType}`"
        />
        <text
          v-for="edge in edges"
          :key="`label-${edge.id}`"
          :x="(edge.x1 + edge.x2) / 2"
          :y="(edge.y1 + edge.y2) / 2 - 4"
          class="edge-label"
        >{{ edge.relationType }}</text>
      </g>
      <!-- 节点 -->
      <g class="nodes">
        <g
          v-for="node in nodes"
          :key="node.id"
          class="node"
          :transform="`translate(${node.x}, ${node.y})`"
          @click="selectNode(node)"
        >
          <circle
            :r="nodeRadius"
            :class="`node-${node.entityType}`"
            :stroke="selectedId === node.id ? '#648cff' : 'none'"
            stroke-width="2"
          />
          <text class="node-label" dy="4">{{ node.title }}</text>
        </g>
      </g>
    </svg>
    <div v-if="selectedNode" class="node-detail">
      <div class="detail-header">
        <span :class="`type-badge badge-${selectedNode.entityType}`">{{ selectedNode.entityType }}</span>
        <span class="detail-title">{{ selectedNode.title }}</span>
      </div>
      <p class="detail-content">{{ selectedNode.content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { cluesApi } from '@/api/clues'

const props = defineProps<{
  campaignId: string
}>()

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const width = 600
const height = 400
const nodeRadius = 20
const selectedId = ref('')

interface GraphNode {
  id: string
  title: string
  content: string
  entityType: string
  x: number
  y: number
}

interface GraphEdge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  relationType: string
}

const rawClues = ref<any[]>([])
const rawRelations = ref<any[]>([])
const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])

const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedId.value))

function layoutNodes() {
  const clueNodes: GraphNode[] = rawClues.value.map((c, i) => {
    const angle = (2 * Math.PI * i) / rawClues.value.length - Math.PI / 2
    const rx = width * 0.35
    const ry = height * 0.35
    return {
      id: c.id,
      title: c.title,
      content: c.content,
      entityType: c.entityType || 'clue',
      x: width / 2 + rx * Math.cos(angle),
      y: height / 2 + ry * Math.sin(angle),
    }
  })
  nodes.value = clueNodes

  const nodeMap = new Map(clueNodes.map((n) => [n.id, n]))
  edges.value = rawRelations.value
    .filter((r) => nodeMap.has(r.sourceId) && nodeMap.has(r.targetId))
    .map((r) => {
      const src = nodeMap.get(r.sourceId)!
      const tgt = nodeMap.get(r.targetId)!
      return {
        id: r.id,
        x1: src.x, y1: src.y,
        x2: tgt.x, y2: tgt.y,
        relationType: r.relationType,
      }
    })
}

function selectNode(node: GraphNode) {
  selectedId.value = selectedId.value === node.id ? '' : node.id
}

async function refresh() {
  const [cluesRes, relationsRes] = await Promise.all([
    cluesApi.list(props.campaignId),
    cluesApi.relations.list(props.campaignId),
  ])
  rawClues.value = cluesRes.data || []
  rawRelations.value = relationsRes.data || []
  layoutNodes()
}

onMounted(refresh)
</script>

<style scoped>
.relation-graph {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #c0c0c8;
}
.graph-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #2a2a3e;
}
.node-count {
  font-size: 0.7rem;
  color: #666;
}
.graph-canvas {
  flex: 1;
  min-height: 0;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.edge-line { stroke: #4a4a6e; stroke-width: 1.5; }
.edge-关联 { stroke: #648cff; }
.edge-属于 { stroke: #f0a020; }
.edge-位于 { stroke: #5bc0de; }
.edge-label { font-size: 8px; fill: #8a8a9a; text-anchor: middle; }
.node { cursor: pointer; }
.node-label { font-size: 8px; fill: #c0c0c8; text-anchor: middle; pointer-events: none; }
.node-clue circle { fill: #2a4a3e; }
.node-npc circle { fill: #4a2a3e; }
.node-location circle { fill: #2a3a4e; }
.node-organization circle { fill: #4a4a2e; }
.node-event circle { fill: #3e2a4a; }
.node-detail {
  border-top: 1px solid #2a2a3e;
  padding: 8px;
  max-height: 120px;
  overflow-y: auto;
}
.detail-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.type-badge {
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}
.badge-clue { background: #2a4a3e; color: #5bc0a0; }
.badge-npc { background: #4a2a3e; color: #e0a0c0; }
.badge-location { background: #2a3a4e; color: #60a0e0; }
.badge-organization { background: #4a4a2e; color: #c0c060; }
.badge-event { background: #3e2a4a; color: #c080e0; }
.detail-title { font-size: 0.85rem; font-weight: 600; color: #e0e0e8; }
.detail-content { font-size: 0.75rem; color: #8a8a9a; margin: 0; line-height: 1.4; }
</style>
