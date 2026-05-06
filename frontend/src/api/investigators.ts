import api from './client'

export const investigatorsApi = {
  list: () => api.get('/investigators'),
  get: (id: string) => api.get(`/investigators/${id}`),
  create: (data: any) => api.post('/investigators', data),
  update: (id: string, data: any) => api.patch(`/investigators/${id}`, data),
  delete: (id: string) => api.delete(`/investigators/${id}`),
}
