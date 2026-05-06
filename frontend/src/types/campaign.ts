export interface Campaign {
  id: string
  kpId: string
  title: string
  description?: string
  era?: string
  status: string
  aiEnabled: boolean
  aiConfig?: any
  currentSceneId?: string
  sessionStatus: string
  scenes: Scene[]
  members: CampaignMember[]
  createdAt: string
}

export interface CampaignMember {
  id: string
  userId: string
  username: string
  investigatorId?: string
  investigator?: any
  role: string
  status: string
}

export interface Scene {
  id: string
  name: string
  description?: string
  backgroundImage?: string
  isActive: boolean
}

export interface Message {
  id: string
  campaignId: string
  senderId?: string
  senderName: string
  senderType: string
  content: string
  messageType: string
  metadata?: any
  createdAt: string
  _typing?: boolean
}
