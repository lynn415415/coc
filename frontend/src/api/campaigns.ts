import api from './client'

export const campaignsApi = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  join: (id: string) => api.post(`/campaigns/${id}/join`),
  start: (id: string) => api.post(`/campaigns/${id}/start`),
  end: (id: string) => api.post(`/campaigns/${id}/end`),
  bindInvestigator: (id: string, investigatorId: string) =>
    api.post(`/campaigns/${id}/bind-investigator`, { investigatorId }),
  unbindInvestigator: (id: string) =>
    api.post(`/campaigns/${id}/unbind-investigator`),
  export: (id: string) => api.get(`/campaigns/${id}/export`),
  messages: (id: string, params?: any) =>
    api.get(`/campaigns/${id}/messages`, { params }),
  markEvent: (messageId: string) =>
    api.post(`/messages/${messageId}/mark-event`),
  timeline: (id: string) =>
    api.get(`/campaigns/${id}/messages/timeline`),
  timelineExport: (id: string) =>
    api.get(`/campaigns/${id}/messages/timeline/export`),
}
