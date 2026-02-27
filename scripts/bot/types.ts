import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

// --- Shared Types ---
export interface RegState {
    step: 'FIO' | 'PHONE' | 'PTS' | 'STS' | 'LICENSE' | 'CAR';
    role: 'DRIVER' | 'DISPATCHER';
    fullFio?: string;
    phone?: string;
    ptsNumber?: string;
    stsPhotoId?: string;
    licensePhotoId?: string;
    carPhotoId?: string;
    messageIdsToDelete: number[];
}

// --- Shared Dependencies Container ---
export interface BotDeps {
    bot: Telegraf;
    prisma: PrismaClient;
    adminId: string;
    pendingRegistrations: Map<string, RegState>;
    pendingBugReports: Set<string>;
    pendingSupportCreates: Set<string>;
    adminReplyingTo: Map<string, string>;
}
