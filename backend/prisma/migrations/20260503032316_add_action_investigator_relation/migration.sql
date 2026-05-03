-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionRecord" (
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
INSERT INTO "new_ActionRecord" ("actionType", "campaignId", "createdAt", "description", "id", "investigatorId", "resolvedBy", "rollRecordId", "status", "targetId", "updatedAt", "userId") SELECT "actionType", "campaignId", "createdAt", "description", "id", "investigatorId", "resolvedBy", "rollRecordId", "status", "targetId", "updatedAt", "userId" FROM "ActionRecord";
DROP TABLE "ActionRecord";
ALTER TABLE "new_ActionRecord" RENAME TO "ActionRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
