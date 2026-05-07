import api from './client'

export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (data: any) => api.patch('/users/me', data),
  findAll: (page = 1, limit = 20, role?: string) =>
    api.get('/users', { params: { page, limit, role } }),
  findOne: (id: string) => api.get(`/users/${id}`),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
  getKpList: () => api.get('/users/kp-list'),
}
