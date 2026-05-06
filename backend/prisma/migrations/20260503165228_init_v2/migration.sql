-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PLAYER',
    "kpApprovedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Investigator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "era" TEXT NOT NULL DEFAULT 'MODERN',
    "age" INTEGER NOT NULL DEFAULT 25,
    "gender" TEXT,
    "residence" TEXT,
    "birthplace" TEXT,
    "currentTime" TEXT,
    "str" INTEGER NOT NULL DEFAULT 50,
    "con" INTEGER NOT NULL DEFAULT 50,
    "siz" INTEGER NOT NULL DEFAULT 50,
    "dex" INTEGER NOT NULL DEFAULT 50,
    "app" INTEGER NOT NULL DEFAULT 50,
    "int" INTEGER NOT NULL DEFAULT 50,
    "pow" INTEGER NOT NULL DEFAULT 50,
    "edu" INTEGER NOT NULL DEFAULT 50,
    "luck" INTEGER NOT NULL DEFAULT 50,
    "baseStr" INTEGER,
    "baseCon" INTEGER,
    "baseSiz" INTEGER,
    "baseDex" INTEGER,
    "baseApp" INTEGER,
    "baseInt" INTEGER,
    "basePow" INTEGER,
    "baseEdu" INTEGER,
    "baseLuck" INTEGER,
    "eduImprovementRolls" INTEGER NOT NULL DEFAULT 0,
    "eduImprovementResults" TEXT,
    "hp" INTEGER,
    "maxHp" INTEGER,
    "san" INTEGER,
    "maxSan" INTEGER,
    "mp" INTEGER,
    "maxMp" INTEGER,
    "mov" INTEGER,
    "db" TEXT,
    "build" INTEGER,
    "damageBonus" TEXT,
    "majorWoundValue" INTEGER,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "sanLossToday" INTEGER NOT NULL DEFAULT 0,
    "magicUsed" INTEGER NOT NULL DEFAULT 0,
    "mentalStability" BOOLEAN NOT NULL DEFAULT false,
    "occupationId" INTEGER,
    "creditRating" INTEGER NOT NULL DEFAULT 0,
    "livingStandard" TEXT,
    "cash" INTEGER NOT NULL DEFAULT 0,
    "assets" INTEGER NOT NULL DEFAULT 0,
    "spendingLevel" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "belief" TEXT,
    "significantPeople" TEXT,
    "meaningfulLocations" TEXT,
    "treasuredPossessions" TEXT,
    "traits" TEXT,
    "injuriesAndScars" TEXT,
    "phobiasAndManias" TEXT,
    "tomesSpellsArtifacts" TEXT,
    "encountersWithStrange" TEXT,
    "alliesAndOrganizations" TEXT,
    "spells" TEXT,
    "notes" TEXT,
    "experiencePackage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "campaignId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investigator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investigator_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestigatorVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "changedBy" TEXT,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestigatorVersion_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT,
    "baseValue" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isRare" BOOLEAN NOT NULL DEFAULT false,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
    "radarCategory" TEXT
);

-- CreateTable
CREATE TABLE "InvestigatorSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,
    "customName" TEXT,
    "initial" INTEGER NOT NULL DEFAULT 0,
    "growth" INTEGER NOT NULL DEFAULT 0,
    "occupational" INTEGER NOT NULL DEFAULT 0,
    "interest" INTEGER NOT NULL DEFAULT 0,
    "isOccupational" BOOLEAN NOT NULL DEFAULT false,
    "successMarked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InvestigatorSkill_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Occupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "era" TEXT,
    "creditMin" INTEGER NOT NULL DEFAULT 0,
    "creditMax" INTEGER NOT NULL DEFAULT 99,
    "pointFormula" TEXT,
    "pointFormulaDesc" TEXT,
    "skillIds" TEXT NOT NULL,
    "anyTalentCount" INTEGER NOT NULL DEFAULT 0,
    "eraTalentCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "skillName" TEXT,
    "skillId" INTEGER,
    "damageFormula" TEXT NOT NULL,
    "baseRange" TEXT,
    "impale" BOOLEAN NOT NULL DEFAULT false,
    "attacksPerRound" TEXT,
    "ammoCapacity" TEXT,
    "malfunction" INTEGER,
    "era" TEXT,
    "price" TEXT,
    "inventionYear" TEXT,
    "description" TEXT,
    CONSTRAINT "Weapon_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Armor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "armorValue" INTEGER NOT NULL DEFAULT 0,
    "movPenalty" INTEGER NOT NULL DEFAULT 0,
    "coverage" TEXT,
    "applicableTo" TEXT,
    "resistPuncture" BOOLEAN NOT NULL DEFAULT false,
    "era" TEXT,
    "price" TEXT,
    "category" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "skill" TEXT,
    "mov" INTEGER,
    "build" TEXT,
    "passengerArmor" INTEGER,
    "passengers" TEXT,
    "driverBuild" TEXT,
    "riderBuild" TEXT,
    "era" TEXT,
    "category" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AssetReference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "era" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "crMin" INTEGER NOT NULL,
    "crMax" INTEGER NOT NULL,
    "cashMultiplier" INTEGER NOT NULL,
    "assetMultiplier" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InvestigatorWeapon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "weaponId" INTEGER NOT NULL,
    "customName" TEXT,
    "successRate" INTEGER NOT NULL DEFAULT 0,
    "currentAmmo" INTEGER,
    "isJammed" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigatorWeapon_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorWeapon_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestigatorArmor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "armorId" INTEGER NOT NULL,
    "currentDurability" INTEGER,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigatorArmor_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorArmor_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "Armor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestigatorVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "customName" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigatorVehicle_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestigatorAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigatorAsset_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "weight" REAL,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "maxStack" INTEGER NOT NULL DEFAULT 1,
    "usable" BOOLEAN NOT NULL DEFAULT false,
    "useEffect" TEXT,
    "era" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InvestigatorItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigatorId" TEXT NOT NULL,
    "itemTemplateId" INTEGER,
    "weaponId" INTEGER,
    "armorId" INTEGER,
    "customName" TEXT,
    "location" TEXT NOT NULL DEFAULT 'storage',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currentAmmo" INTEGER,
    "isJammed" BOOLEAN NOT NULL DEFAULT false,
    "currentDurability" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestigatorItem_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorItem_itemTemplateId_fkey" FOREIGN KEY ("itemTemplateId") REFERENCES "ItemTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorItem_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvestigatorItem_armorId_fkey" FOREIGN KEY ("armorId") REFERENCES "Armor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpId" TEXT NOT NULL,
    "moduleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "era" TEXT,
    "rollMethod" TEXT NOT NULL DEFAULT 'DICE',
    "pointBuyTotal" INTEGER,
    "customRules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECRUITING',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiConfig" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentSceneId" TEXT,
    "sessionStatus" TEXT NOT NULL DEFAULT 'IDLE',
    CONSTRAINT "Campaign_kpId_fkey" FOREIGN KEY ("kpId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investigatorId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PLAYER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CampaignMember_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Phobia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rollMin" INTEGER NOT NULL,
    "rollMax" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Mania" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rollMin" INTEGER NOT NULL,
    "rollMax" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "InsanityEpisode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "episodeType" TEXT NOT NULL,
    "rollValue" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "campaignId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "backgroundImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scene_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderType" TEXT NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RollRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT,
    "investigatorId" TEXT,
    "userId" TEXT,
    "rollType" TEXT NOT NULL,
    "skillName" TEXT,
    "targetValue" INTEGER NOT NULL,
    "rollResult" INTEGER NOT NULL,
    "successLevel" TEXT NOT NULL,
    "bonusDice" INTEGER NOT NULL DEFAULT 0,
    "penaltyDice" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RollRecord_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "investigatorId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "rollRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionRecord_rollRecordId_fkey" FOREIGN KEY ("rollRecordId") REFERENCES "RollRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecord_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuickPanelSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "slotType" TEXT NOT NULL,
    "targetId" TEXT,
    "customLabel" TEXT,
    "customValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CombatRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 1,
    "turnIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "CombatRound_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Combatant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "combatRoundId" TEXT NOT NULL,
    "investigatorId" TEXT,
    "name" TEXT NOT NULL,
    "initiative" INTEGER NOT NULL,
    "initiativeRoll" INTEGER NOT NULL,
    "hp" INTEGER,
    "maxHp" INTEGER,
    "san" INTEGER,
    "maxSan" INTEGER,
    "mp" INTEGER,
    "maxMp" INTEGER,
    "isNpc" BOOLEAN NOT NULL DEFAULT false,
    "isVisibleToPlayers" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Combatant_combatRoundId_fkey" FOREIGN KEY ("combatRoundId") REFERENCES "CombatRound" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "combatantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roundsRemaining" INTEGER,
    "modifier" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Condition_combatantId_fkey" FOREIGN KEY ("combatantId") REFERENCES "Combatant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SceneToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sceneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL DEFAULT 40,
    "height" REAL NOT NULL DEFAULT 40,
    "rotation" REAL NOT NULL DEFAULT 0,
    "faction" TEXT NOT NULL DEFAULT 'neutral',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "labels" JSONB,
    "linkedInvestigatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SceneToken_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FogData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sceneId" TEXT NOT NULL,
    "gmPaths" JSONB NOT NULL,
    "revealedRegions" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FogData_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Clue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'clue',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "sharedWith" JSONB,
    "createdBy" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "mapPosition" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntityRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timelineId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gameDate" TEXT,
    "realDate" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "clueIds" JSONB,
    "metadata" JSONB,
    CONSTRAINT "TimelineEvent_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "contextType" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "parsedAction" JSONB,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigatorSkill_investigatorId_skillId_customName_key" ON "InvestigatorSkill"("investigatorId", "skillId", "customName");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_userId_key" ON "CampaignMember"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickPanelSlot_userId_campaignId_slotIndex_key" ON "QuickPanelSlot"("userId", "campaignId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "FogData_sceneId_key" ON "FogData"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRelation_campaignId_sourceId_targetId_relationType_key" ON "EntityRelation"("campaignId", "sourceId", "targetId", "relationType");
