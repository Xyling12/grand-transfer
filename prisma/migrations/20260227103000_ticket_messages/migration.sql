-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'SUPPORT';

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketNum" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TicketMessage_ticketNum_idx" ON "TicketMessage"("ticketNum");
