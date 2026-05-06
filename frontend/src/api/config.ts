import api from './client'

export const configApi = {
  skills: {
    list: (params?: any) => api.get('/skills', { params }),
  },
  occupations: {
    list: () => api.get('/occupations'),
    get: (id: number) => api.get(`/occupations/${id}`),
  },
  weapons: {
    list: () => api.get('/weapons'),
    create: (data: any) => api.post('/weapons', data),
    update: (id: number, data: any) => api.patch(`/weapons/${id}`, data),
    delete: (id: number) => api.delete(`/weapons/${id}`),
  },
  armors: {
    list: () => api.get('/armors'),
    create: (data: any) => api.post('/armors', data),
    update: (id: number, data: any) => api.patch(`/armors/${id}`, data),
    delete: (id: number) => api.delete(`/armors/${id}`),
  },
  vehicles: {
    list: () => api.get('/vehicles'),
    create: (data: any) => api.post('/vehicles', data),
    update: (id: number, data: any) => api.patch(`/vehicles/${id}`, data),
    delete: (id: number) => api.delete(`/vehicles/${id}`),
  },
  dice: {
    roll: (data: any) => api.post('/dice/roll', data),
    check: (data: any) => api.post('/dice/check', data),
    attributes: () => api.post('/dice/attributes'),
  },
}
