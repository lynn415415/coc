/*
  Warnings:

  - You are about to drop the column `ageAdjustmentApplied` on the `Investigator` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investigator" (
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
INSERT INTO "new_Investigator" ("age", "app", "assets", "belief", "birthplace", "build", "campaignId", "cash", "con", "createdAt", "creditRating", "currentTime", "damageBonus", "db", "description", "dex", "edu", "eduImprovementRolls", "encountersWithStrange", "era", "experiencePackage", "gender", "hp", "id", "injuriesAndScars", "int", "livingStandard", "luck", "magicUsed", "majorWoundValue", "maxHp", "maxMp", "maxSan", "meaningfulLocations", "mentalStability", "mov", "mp", "name", "occupationId", "phobiasAndManias", "pow", "residence", "san", "sanLossToday", "significantPeople", "siz", "spendingLevel", "status", "str", "tempHp", "tomesSpellsArtifacts", "traits", "treasuredPossessions", "updatedAt", "userId", "version") SELECT "age", "app", "assets", "belief", "birthplace", "build", "campaignId", "cash", "con", "createdAt", "creditRating", "currentTime", "damageBonus", "db", "description", "dex", "edu", "eduImprovementRolls", "encountersWithStrange", "era", "experiencePackage", "gender", "hp", "id", "injuriesAndScars", "int", "livingStandard", "luck", "magicUsed", "majorWoundValue", "maxHp", "maxMp", "maxSan", "meaningfulLocations", "mentalStability", "mov", "mp", "name", "occupationId", "phobiasAndManias", "pow", "residence", "san", "sanLossToday", "significantPeople", "siz", "spendingLevel", "status", "str", "tempHp", "tomesSpellsArtifacts", "traits", "treasuredPossessions", "updatedAt", "userId", "version" FROM "Investigator";
DROP TABLE "Investigator";
ALTER TABLE "new_Investigator" RENAME TO "Investigator";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
