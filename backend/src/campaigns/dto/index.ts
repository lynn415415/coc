import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  @Type(() => Number)
  maxPlayers?: number;

  @IsString()
  @IsOptional()
  era?: string;

  @IsString()
  @IsOptional()
  rollMethod?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pointBuyTotal?: number;

  @IsString()
  @IsOptional()
  customRules?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  aiEnabled?: boolean;

  @IsOptional()
  aiConfig?: any;
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  @Type(() => Number)
  maxPlayers?: number;

  @IsString()
  @IsOptional()
  era?: string;

  @IsString()
  @IsOptional()
  rollMethod?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pointBuyTotal?: number;

  @IsString()
  @IsOptional()
  customRules?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  aiEnabled?: boolean;

  @IsOptional()
  aiConfig?: any;

  @IsString()
  @IsOptional()
  currentSceneId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  sessionStatus?: string;
}

export class BindInvestigatorDto {
  @IsString()
  investigatorId: string;
}
