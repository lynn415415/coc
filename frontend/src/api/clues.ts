import api from './client'

export const cluesApi = {
  list: (campaignId: string) => api.get(`/campaigns/${campaignId}/clues`),
  create: (campaignId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/clues`, data),
  update: (campaignId: string, clueId: string, data: any) =>
    api.patch(`/campaigns/${campaignId}/clues/${clueId}`, data),
  delete: (campaignId: string, clueId: string) =>
    api.delete(`/campaigns/${campaignId}/clues/${clueId}`),
  share: (campaignId: string, clueId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/clues/${clueId}/share`, data),
  relations: {
    list: (campaignId: string) =>
      api.get(`/campaigns/${campaignId}/relations`),
    create: (campaignId: string, data: any) =>
      api.post(`/campaigns/${campaignId}/relations`, data),
    update: (campaignId: string, id: string, data: any) =>
      api.patch(`/campaigns/${campaignId}/relations/${id}`, data),
    delete: (campaignId: string, id: string) =>
      api.delete(`/campaigns/${campaignId}/relations/${id}`),
    byEntity: (campaignId: string, entityId: string) =>
      api.get(`/campaigns/${campaignId}/relations/entity/${entityId}`),
  },
}
