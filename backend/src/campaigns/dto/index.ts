export class CreateCampaignDto {
  title: string;
  description?: string;
  maxPlayers?: number;
  era?: string;
  rollMethod?: string;
  pointBuyTotal?: number;
  customRules?: string;
  isPublic?: boolean;
}

export class UpdateCampaignDto {
  title?: string;
  description?: string;
  maxPlayers?: number;
  era?: string;
  rollMethod?: string;
  pointBuyTotal?: number;
  customRules?: string;
  isPublic?: boolean;
  aiEnabled?: string;
}

export class BindInvestigatorDto {
  investigatorId: string;
}
