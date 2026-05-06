import api from './client'

export const scenesApi = {
  list: (campaignId: string) => api.get(`/campaigns/${campaignId}/scenes`),
  get: (sceneId: string) => api.get(`/scenes/${sceneId}`),
  create: (campaignId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/scenes`, data),
  update: (sceneId: string, data: any) => api.patch(`/scenes/${sceneId}`, data),
  tokens: {
    list: (sceneId: string) => api.get(`/scenes/${sceneId}/tokens`),
    create: (sceneId: string, data: any) =>
      api.post(`/scenes/${sceneId}/tokens`, data),
    batchUpdate: (sceneId: string, data: any) =>
      api.patch(`/scenes/${sceneId}/tokens/batch`, data),
    delete: (sceneId: string, tokenId: string) =>
      api.delete(`/scenes/${sceneId}/tokens/${tokenId}`),
  },
  fog: {
    get: (sceneId: string) => api.get(`/scenes/${sceneId}/fog`),
    update: (sceneId: string, data: any) =>
      api.put(`/scenes/${sceneId}/fog`, data),
  },
}
