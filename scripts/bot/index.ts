import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

import { RegState, BotDeps } from './types';
import { checkAuth, getMainMenu } from './helpers';
import { registerRegistrationHandlers, handleRegistrationMessage } from './registration';
import { registerOrderHandlers } from './orders';
import { registerTicketHandlers, handleTicketMessages } from './tickets';
import { registerAdminHandlers } from './admin';
import { registerModerationHandlers } from './moderation';

dotenv.config();

// --- Initialization ---
const token = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/['"]/g, '').trim();

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing or invalid! Telegram Bot will NOT start.');
}

const bot = new Telegraf(token || 'dummy:123456');
const prisma = new PrismaClient();
const adminId = (process.env.TELEGRAM_CHAT_ID || '').replace(/['"]/g, '').trim();

// --- Shared State ---
const pendingRegistrations = new Map<string, RegState>();
const pendingBugReports = new Set<string>();
const pendingSupportCreates = new Set<string>();
const adminReplyingTo = new Map<string, string>();
const userReplyingTo = new Map<string, string>();
const pendingEdits = new Map<string, { orderId: number, field: string }>();

// --- Dependencies Container ---
const deps: BotDeps = {
    bot,
    prisma,
    adminId,
    pendingRegistrations,
    pendingBugReports,
    pendingSupportCreates,
    adminReplyingTo,
    userReplyingTo,
    pendingEdits,
};

// --- /start Command ---
bot.start(async (ctx) => {
    const telegramIdStr = ctx.chat.id.toString();
    const telegramIdBigInt = BigInt(ctx.chat.id);

    try {
        let driver = await prisma.driver.findUnique({
            where: { telegramId: telegramIdBigInt }
        });

        const isInitialAdmin = (telegramIdStr === adminId);

        if (!driver) {
            if (isInitialAdmin) {
                driver = await prisma.driver.create({
                    data: {
                        telegramId: telegramIdBigInt,
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                        status: 'APPROVED',
                        role: 'ADMIN'
                    }
                });
                return ctx.reply('Добро пожаловать, Главный Администратор! Вы автоматически зарегистрированы и одобрены.', { ...getMainMenu(telegramIdStr, 'ADMIN', adminId), protect_content: false });
            } else {
                return ctx.reply(
                    'Здравствуйте! Добро пожаловать в Telegram-бот GrandTransfer.\n\nКем вы хотите стать?\n\n⚠️ Нажимая кнопки ниже, вы даете согласие на обработку ваших персональных данных (Имя, Фамилия, Telegram ID) в соответствии с ФЗ-152.',
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📝 Подать заявку (Водитель)', callback_data: 'register_role_DRIVER' }],
                                [{ text: '🎧 Подать заявку (Диспетчер)', callback_data: 'register_role_DISPATCHER' }]
                            ]
                        }
                    }
                );
            }
        } else if (isInitialAdmin && (driver.status !== 'APPROVED' || driver.role !== 'ADMIN')) {
            driver = await prisma.driver.update({
                where: { telegramId: telegramIdBigInt },
                data: { status: 'APPROVED', role: 'ADMIN' }
            });
            return ctx.reply('Добро пожаловать, Главный Администратор! Ваши права восстановлены.', { ...getMainMenu(telegramIdStr, 'ADMIN', adminId), protect_content: false });
        }

        if (driver.status === 'PENDING') {
            return ctx.reply('Ваша заявка все еще находится на рассмотрении у администратора.', { reply_markup: { remove_keyboard: true } });
        } else if (driver.status === 'BANNED') {
            return ctx.reply('Доступ в систему заблокирован.', { reply_markup: { remove_keyboard: true } });
        } else if (driver.status === 'APPROVED') {
            return ctx.reply('Добро пожаловать в рабочую панель водителя GrandTransfer! Ожидайте новых заказов.\n\n⚠️ <i>В работе бота возможны ошибки. Если находите ошибки, нажмите кнопку</i> <b>🛠 Найдена ошибка</b> <i>и опишите её — будем очень признательны!</i>', { ...getMainMenu(telegramIdStr, driver.role, adminId), parse_mode: 'HTML' });
        }
    } catch (e) {
        console.error('Error in /start:', e);
        ctx.reply('Произошла ошибка базы данных.');
    }
});

// --- /cancel Command ---
bot.command('cancel', async (ctx) => {
    const tgIdStr = ctx.chat.id.toString();
    let cancelled = false;

    if (pendingRegistrations.has(tgIdStr)) {
        pendingRegistrations.delete(tgIdStr);
        cancelled = true;
    }
    if (pendingBugReports.has(tgIdStr)) {
        pendingBugReports.delete(tgIdStr);
        cancelled = true;
    }
    if (pendingSupportCreates.has(tgIdStr)) {
        pendingSupportCreates.delete(tgIdStr);
        cancelled = true;
    }
    if (adminReplyingTo.has(tgIdStr)) {
        adminReplyingTo.delete(tgIdStr);
        cancelled = true;
    }
    if (userReplyingTo.has(tgIdStr)) {
        userReplyingTo.delete(tgIdStr);
        cancelled = true;
    }
    if (pendingEdits.has(tgIdStr)) {
        pendingEdits.delete(tgIdStr);
        cancelled = true;
    }

    if (cancelled) {
        const { auth, role } = await checkAuth(ctx, deps).catch(() => ({ auth: false, role: 'USER' }));
        const menu = auth ? getMainMenu(tgIdStr, role, adminId) : { reply_markup: { remove_keyboard: true as const } };
        ctx.reply('❌ Действие отменено.', menu);
    } else {
        ctx.reply('Нет активных действий для отмены.');
    }
});

// --- Register All Module Handlers ---
registerRegistrationHandlers(deps);
registerOrderHandlers(deps);
registerTicketHandlers(deps);
registerAdminHandlers(deps);

// --- Message Router (must be registered AFTER all hears/action handlers, BEFORE moderation) ---
// This handles: registration state machine, bug reports, support tickets, and admin replies
bot.on('message', async (ctx, next) => {
    const tgIdStr = ctx.chat.id.toString();

    // 1. Registration state machine (highest priority for pending registrations)
    if (pendingRegistrations.has(tgIdStr)) {
        const handled = await handleRegistrationMessage(ctx, deps);
        if (handled) return;
    }

    // 2. Pending order edits (before tickets)
    if (pendingEdits.has(tgIdStr)) {
        const edit = pendingEdits.get(tgIdStr)!;
        pendingEdits.delete(tgIdStr);
        const text = (ctx.message as any)?.text?.trim();
        if (!text) {
            await ctx.reply('❌ Пожалуйста, отправьте текстовое значение.');
            return;
        }
        try {
            const updateData: any = {};
            if (edit.field === 'passengers') {
                updateData[edit.field] = parseInt(text, 10) || 1;
            } else if (edit.field === 'priceEstimate') {
                updateData[edit.field] = parseFloat(text) || null;
            } else {
                updateData[edit.field] = text;
            }
            await prisma.order.update({ where: { id: edit.orderId }, data: updateData });

            // Log to AuditLog
            try {
                await prisma.auditLog.create({
                    data: {
                        action: 'EDIT_ORDER',
                        actorId: tgIdStr,
                        actorName: ctx.from?.first_name || 'Unknown',
                        targetId: edit.orderId.toString(),
                        details: `${edit.field} → ${text}`
                    }
                });
            } catch (e) { /* AuditLog may not exist yet */ }

            const { auth, role } = await checkAuth(ctx, deps).catch(() => ({ auth: false, role: 'USER' }));
            const menu = auth ? getMainMenu(tgIdStr, role, adminId) : { reply_markup: { remove_keyboard: true as const } };
            await ctx.reply(`✅ Заявка №${edit.orderId}: поле <b>${edit.field}</b> обновлено на: <b>${text}</b>`, { parse_mode: 'HTML' as const, ...menu });
            return;
        } catch (err) {
            console.error('Edit order error:', err);
            await ctx.reply('❌ Ошибка при обновлении заявки.');
            return;
        }
    }

    // 3. Ticket-related messages (bug reports, support creates, admin replies)
    const ticketHandled = await handleTicketMessages(ctx, deps);
    if (ticketHandled) return;

    // 3. If nothing consumed it, move to next middleware (moderation)
    return next();
});

// --- Moderation (must be LAST as a catch-all for group messages) ---
registerModerationHandlers(deps);

// --- Bot Startup ---
let isShuttingDown = false;

async function startBot() {
    while (!isShuttingDown) {
        try {
            console.log('🤖 Telegram bot is starting...');
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            await bot.launch({ dropPendingUpdates: true });
            console.log('🤖 Telegram bot stopped normally. Waiting 10s before restart to prevent Docker loop...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.error('Bot crashed, restarting in 5s...', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startBot();

process.once('SIGINT', () => { isShuttingDown = true; bot.stop('SIGINT'); });
process.once('SIGTERM', () => { isShuttingDown = true; bot.stop('SIGTERM'); });
