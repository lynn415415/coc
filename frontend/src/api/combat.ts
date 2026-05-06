import api from './client'

export const combatApi = {
  get: (campaignId: string) => api.get(`/combat/${campaignId}`),
  start: (campaignId: string, data: any) => api.post(`/combat/${campaignId}/start`, data),
  nextTurn: (campaignId: string) => api.post(`/combat/${campaignId}/next-turn`),
  end: (campaignId: string) => api.post(`/combat/${campaignId}/end`),
  tickConditions: (campaignId: string) => api.post(`/combat/${campaignId}/tick-conditions`),
  updateHp: (combatantId: string, hp: number) =>
    api.patch(`/combat/combatant/${combatantId}/hp`, { hp }),
  updateSan: (combatantId: string, san: number) =>
    api.patch(`/combat/combatant/${combatantId}/san`, { san }),
  updateMp: (combatantId: string, mp: number) =>
    api.patch(`/combat/combatant/${combatantId}/mp`, { mp }),
  addCondition: (combatantId: string, data: any) =>
    api.post(`/combat/combatant/${combatantId}/condition`, data),
  removeCondition: (conditionId: string) =>
    api.delete(`/combat/condition/${conditionId}`),
}
