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
    "ageAdjustmentApplied" BOOLEAN NOT NULL DEFAULT false,
    "eduImprovementRolls" INTEGER NOT NULL DEFAULT 0,
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
    "assets" TEXT,
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
    "skillId" INTEGER,
    "damageFormula" TEXT NOT NULL,
    "baseRange" TEXT,
    "impale" BOOLEAN NOT NULL DEFAULT false,
    "attacksPerRound" TEXT,
    "ammoCapacity" INTEGER,
    "malfunction" INTEGER,
    "era" TEXT,
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
    "description" TEXT
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
    CONSTRAINT "InvestigatorItem_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "aiEnabled" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigatorSkill_investigatorId_skillId_customName_key" ON "InvestigatorSkill"("investigatorId", "skillId", "customName");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_userId_key" ON "CampaignMember"("campaignId", "userId");
