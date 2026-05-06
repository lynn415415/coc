-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "sceneId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'clue',
    "privacy" TEXT NOT NULL DEFAULT 'private',
    "sharedWith" JSONB,
    "triggerCondition" TEXT,
    "createdBy" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "mapPosition" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Clue_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Clue" ("campaignId", "content", "createdAt", "createdBy", "entityType", "id", "mapPosition", "metadata", "privacy", "sharedWith", "sourceMessageId", "title", "updatedAt") SELECT "campaignId", "content", "createdAt", "createdBy", "entityType", "id", "mapPosition", "metadata", "privacy", "sharedWith", "sourceMessageId", "title", "updatedAt" FROM "Clue";
DROP TABLE "Clue";
ALTER TABLE "new_Clue" RENAME TO "Clue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
