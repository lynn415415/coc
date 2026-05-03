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
    "metadata" TEXT,
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
    "metadata" TEXT,
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
    CONSTRAINT "ActionRecord_rollRecordId_fkey" FOREIGN KEY ("rollRecordId") REFERENCES "RollRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
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
    "currentSceneId" TEXT,
    "sessionStatus" TEXT NOT NULL DEFAULT 'IDLE',
    CONSTRAINT "Campaign_kpId_fkey" FOREIGN KEY ("kpId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("aiEnabled", "createdAt", "customRules", "description", "era", "id", "isPublic", "kpId", "maxPlayers", "moduleId", "pointBuyTotal", "rollMethod", "status", "title", "updatedAt") SELECT "aiEnabled", "createdAt", "customRules", "description", "era", "id", "isPublic", "kpId", "maxPlayers", "moduleId", "pointBuyTotal", "rollMethod", "status", "title", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "QuickPanelSlot_userId_campaignId_slotIndex_key" ON "QuickPanelSlot"("userId", "campaignId", "slotIndex");
