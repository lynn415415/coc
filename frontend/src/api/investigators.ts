import api from './client'

export const investigatorsApi = {
  list: () => api.get('/investigators'),
  get: (id: string) => api.get(`/investigators/${id}`),
  create: (data: any) => api.post('/investigators', data),
  update: (id: string, data: any) => api.patch(`/investigators/${id}`, data),
  delete: (id: string) => api.delete(`/investigators/${id}`),
  submit: (id: string, reviewerId?: string) =>
    api.post(`/investigators/${id}/submit`, { reviewerId }),
  approve: (id: string) => api.post(`/investigators/${id}/approve`),
  reject: (id: string, note?: string) =>
    api.post(`/investigators/${id}/reject`, { note }),
  reviewQueue: () => api.get('/investigators/review-queue'),
}
