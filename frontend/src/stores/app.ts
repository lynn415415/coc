import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const currentCampaignId = ref<string | null>(null)

  return { sidebarCollapsed, loading, currentCampaignId }
})
