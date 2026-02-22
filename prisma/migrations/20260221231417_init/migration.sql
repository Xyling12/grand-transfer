-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "tariff" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL,
    "priceEstimate" REAL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "comments" TEXT
);
