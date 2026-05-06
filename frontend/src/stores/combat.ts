import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number | null
  maxHp: number | null
  san: number | null
  maxSan: number | null
  mp: number | null
  maxMp: number | null
  isNpc: boolean
  conditions: any[]
  sortOrder: number
}

export interface CombatRound {
  id: string
  campaignId: string
  roundNumber: number
  turnIndex: number
  status: string
  combatants: Combatant[]
}

export const useCombatStore = defineStore('combat', () => {
  const combat = ref<CombatRound | null>(null)

  const isActive = computed(() => combat.value?.status === 'ACTIVE')
  const currentCombatant = computed(() => {
    if (!combat.value) return null
    return combat.value.combatants[combat.value.turnIndex] || null
  })
  const sortedCombatants = computed(() => {
    if (!combat.value) return []
    return [...combat.value.combatants].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  function setCombat(data: CombatRound | null) {
    combat.value = data
  }

  function reset() {
    combat.value = null
  }

  return {
    combat, isActive, currentCombatant, sortedCombatants,
    setCombat, reset,
  }
})
