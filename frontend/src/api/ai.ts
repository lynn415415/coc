import api from './client'

export const aiApi = {
  chat: (messages: any[], options?: any) =>
    api.post('/ai/chat', { messages, options }),
  scene: (context: string, campaignId?: string) =>
    api.post('/ai/scene', { context, campaignId }),
  npc: (context: string, campaignId?: string) =>
    api.post('/ai/npc', { context, campaignId }),
  formatCheck: (checkData: any, campaignId?: string) =>
    api.post('/ai/format-check', { checkData, campaignId }),
  suggest: (context: string, campaignId?: string) =>
    api.post('/ai/suggest', { context, campaignId }),
  decisionLog: {
    list: (campaignId: string) =>
      api.get(`/ai/${campaignId}/decision-log`),
    create: (campaignId: string, data: any) =>
      api.post(`/ai/${campaignId}/decision-log`, data),
  },
}
