import { BotDeps } from './types';
import { checkAuth } from './helpers';

export function registerTicketHandlers(deps: BotDeps) {
    const { bot, prisma, adminId, pendingBugReports, pendingSupportCreates, adminReplyingTo, userReplyingTo } = deps;

    // Bug Report Entry Point
    bot.hears('🛠 Найдена ошибка', async (ctx) => {
        const tgIdStr = ctx.chat.id.toString();
        pendingBugReports.add(tgIdStr);

        return ctx.reply(
            '🛠 <b>Сообщение об ошибке</b>\n\nПожалуйста, максимально подробно опишите ошибку, которую вы нашли. Ваше следующее сообщение будет отправлено тех. поддержке.\n\n<i>Отправьте /cancel для отмены.</i>',
            { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
        );
    });

    // Support System Entry Point (renamed button)
    bot.hears('🆘 Написать в поддержку', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role === 'PENDING' || role === 'BANNED') return;

        const tgIdStr = ctx.chat.id.toString();
        pendingSupportCreates.add(tgIdStr);

        return ctx.reply(
            '🆘 <b>Обращение в администрацию</b>\n\nНапишите ваш вопрос, проблему или предложение одним сообщением. Оно будет направлено всем дежурным администраторам диспетчерской службы.\n\n<i>Отправьте /cancel для отмены.</i>',
            { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
        );
    });

    // My Tickets — for ALL roles
    bot.hears('📩 Мои обращения', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth) return;

        const tgIdStr = ctx.chat.id.toString();

        try {
            const tickets = await prisma.supportTicket.findMany({
                where: { authorId: tgIdStr },
                orderBy: { createdAt: 'desc' },
                take: 10
            });

            if (tickets.length === 0) {
                return ctx.reply('📩 У вас пока нет обращений.\n\nЧтобы создать обращение, нажмите "🆘 Написать в поддержку".');
            }

            let msg = '📩 <b>Ваши обращения:</b>\n\n';

            const inlineButtons: any[] = [];

            for (const t of tickets) {
                const statusEmoji = t.status === 'OPEN' ? '🟡' : (t.status === 'IN_PROGRESS' ? '🔵' : '✅');
                const statusText = t.status === 'OPEN' ? 'Ожидает' : (t.status === 'IN_PROGRESS' ? 'В работе' : 'Закрыто');
                const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
                const typeEmoji = t.type === 'BUG' ? '🐛' : '🆘';
                const preview = t.message.length > 50 ? t.message.substring(0, 50) + '...' : t.message;

                msg += `${statusEmoji} ${typeEmoji} <b>№${t.ticketNum}</b> (${dateStr})\n`;
                msg += `<i>${preview}</i>\n`;
                msg += `Статус: <b>${statusText}</b>\n\n`;

                if (t.status !== 'CLOSED') {
                    inlineButtons.push([
                        { text: `✉️ Ответить №${t.ticketNum}`, callback_data: `user_reply_ticket_${t.ticketNum}` },
                        { text: `❌ Закрыть`, callback_data: `user_close_ticket_${t.ticketNum}` }
                    ]);
                } else {
                    inlineButtons.push([
                        { text: `📜 История №${t.ticketNum}`, callback_data: `view_ticket_history_${t.ticketNum}` }
                    ]);
                }
            }

            await ctx.replyWithHTML(msg, {
                reply_markup: { inline_keyboard: inlineButtons }
            });
        } catch (e) {
            console.error('Error fetching user tickets:', e);
            await ctx.reply('❌ Ошибка при получении обращений.');
        }
    });

    // Bug Reports — ADMIN ONLY
    bot.hears('🐛 Баг-репорты', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        try {
            const bugTickets = await prisma.supportTicket.findMany({
                where: { type: 'BUG' },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            if (bugTickets.length === 0) {
                return ctx.reply('🐛 Нет баг-репортов.');
            }

            let msg = '🐛 <b>Баг-репорты:</b>\n\n';
            const inlineButtons: any[] = [];

            for (const t of bugTickets) {
                const statusEmoji = t.status === 'OPEN' ? '🟡' : (t.status === 'IN_PROGRESS' ? '🔵' : '✅');
                const statusText = t.status === 'OPEN' ? 'Открыт' : (t.status === 'IN_PROGRESS' ? 'В работе' : 'Закрыт');
                const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
                const preview = t.message.length > 60 ? t.message.substring(0, 60) + '...' : t.message;

                msg += `${statusEmoji} <b>№${t.ticketNum}</b> от <a href="tg://user?id=${t.authorId}">${t.authorName}</a> (${dateStr})\n`;
                msg += `<i>${preview}</i>\n`;
                msg += `Статус: <b>${statusText}</b>\n\n`;

                if (t.status !== 'CLOSED') {
                    inlineButtons.push([
                        { text: `🙋‍♂️ Взять №${t.ticketNum}`, callback_data: `take_ticket_${t.ticketNum}` },
                        { text: `✉️ Ответить`, callback_data: `reply_ticket_${t.ticketNum}` }
                    ]);
                }
            }

            await ctx.replyWithHTML(msg, {
                reply_markup: inlineButtons.length ? { inline_keyboard: inlineButtons } : undefined
            });
        } catch (e) {
            console.error('Error fetching bug reports:', e);
            await ctx.reply('❌ Ошибка при получении баг-репортов.');
        }
    });

    // View ticket conversation history
    bot.action(/^view_ticket_history_(.+)$/, async (ctx) => {
        const ticketNum = ctx.match[1];

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });
            if (!ticket) return ctx.answerCbQuery('Обращение не найдено.', { show_alert: true });

            const messages = await prisma.ticketMessage.findMany({
                where: { ticketNum },
                orderBy: { createdAt: 'asc' },
                take: 20
            });

            let msg = `📜 <b>История обращения №${ticketNum}</b>\n\n`;
            msg += `<b>Тема:</b> ${ticket.message}\n`;
            msg += `<b>Статус:</b> ${ticket.status === 'CLOSED' ? '✅ Закрыто' : '🔵 В работе'}\n\n`;

            if (messages.length === 0) {
                msg += '<i>Нет сообщений в диалоге.</i>';
            } else {
                for (const m of messages) {
                    const dateStr = new Date(m.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
                    const isAdmin = m.senderId !== ticket.authorId;
                    const icon = isAdmin ? '👨‍💻' : '👤';
                    msg += `${icon} <b>${m.senderName}</b> (${dateStr}):\n${m.message}\n\n`;
                }
            }

            await ctx.answerCbQuery();
            await ctx.replyWithHTML(msg);
        } catch (e) {
            console.error('Error fetching ticket history:', e);
            await ctx.answerCbQuery('Ошибка загрузки истории.', { show_alert: true });
        }
    });

    // User replies to ticket
    bot.action(/^user_reply_ticket_(.+)$/, async (ctx) => {
        const ticketNum = ctx.match[1];
        const tgIdStr = ctx.chat!.id.toString();

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });
            if (!ticket || ticket.status === 'CLOSED') {
                return ctx.answerCbQuery('Обращение закрыто или не найдено.', { show_alert: true });
            }

            if (ticket.authorId !== tgIdStr) {
                return ctx.answerCbQuery('Это не ваше обращение.', { show_alert: true });
            }

            userReplyingTo.set(tgIdStr, ticketNum);
            await ctx.answerCbQuery();
            await ctx.reply(
                `✍️ Напишите ответ по обращению <b>№${ticketNum}</b>. Следующее сообщение будет отправлено администратору.\n\n<i>Отправьте /cancel для отмены.</i>`,
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            );
        } catch (e) {
            console.error('Error setting up user reply:', e);
        }
    });

    // User closes own ticket
    bot.action(/^user_close_ticket_(.+)$/, async (ctx) => {
        const ticketNum = ctx.match[1];
        const tgIdStr = ctx.chat!.id.toString();

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });
            if (!ticket || ticket.status === 'CLOSED') {
                return ctx.answerCbQuery('Обращение уже закрыто.', { show_alert: true });
            }
            if (ticket.authorId !== tgIdStr) {
                return ctx.answerCbQuery('Это не ваше обращение.', { show_alert: true });
            }

            await prisma.supportTicket.update({
                where: { ticketNum },
                data: { status: 'CLOSED', closedAt: new Date() }
            });

            await ctx.answerCbQuery('Обращение закрыто.');
            await ctx.editMessageText(
                (ctx.callbackQuery.message as any)?.text + '\n\n✅ Обращение закрыто вами.',
                { parse_mode: 'HTML' }
            );
        } catch (e) {
            console.error('Error closing ticket by user:', e);
        }
    });

    // Admin takes ticket
    bot.action(/^take_ticket_(.+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('У вас нет прав администратора', { show_alert: true });

        const ticketNum = ctx.match[1];
        const tgIdStr = ctx.chat!.id.toString();

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });

            if (!ticket || ticket.status === 'CLOSED') {
                return ctx.answerCbQuery('Это обращение уже закрыто или не найдено.', { show_alert: true });
            }

            if (ticket.status === 'IN_PROGRESS' && ticket.adminId !== tgIdStr) {
                return ctx.answerCbQuery('Это обращение уже взял другой администратор.', { show_alert: true });
            }

            await prisma.supportTicket.update({
                where: { ticketNum },
                data: { status: 'IN_PROGRESS', adminId: tgIdStr }
            });

            await ctx.answerCbQuery('Вы взяли обращение в работу!');

            await ctx.editMessageReplyMarkup({
                inline_keyboard: [
                    [{ text: '✉️ Написать ответ', callback_data: `reply_ticket_${ticketNum}` }],
                    [{ text: '📜 История', callback_data: `view_ticket_history_${ticketNum}` }],
                    [{ text: '✅ Закрыть обращение', callback_data: `close_ticket_${ticketNum}` }]
                ]
            });

            await ctx.telegram.sendMessage(ticket.authorId, `👨‍💻 <b>Администратор принял ваше обращение №${ticketNum} в работу.</b> Ожидайте ответа.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✉️ Ответить', callback_data: `user_reply_ticket_${ticketNum}` }]
                    ]
                }
            }).catch(() => { });
        } catch (e) {
            console.error('Error taking ticket:', e);
        }
    });

    // Admin replies to ticket
    bot.action(/^reply_ticket_(.+)$/, async (ctx) => {
        const ticketNum = ctx.match[1];

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });
            if (!ticket || ticket.status === 'CLOSED') return ctx.answerCbQuery('Обращение не найдено', { show_alert: true });

            const tgIdStr = ctx.chat!.id.toString();
            adminReplyingTo.set(tgIdStr, ticketNum);

            await ctx.answerCbQuery();
            await ctx.reply(`✍️ Напишите ответ для обращения <b>№${ticketNum}</b>. Следующее ваше сообщение будет отправлено автору.\n\n<i>Отправьте /cancel для отмены.</i>`, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
        } catch (e) {
            console.error('Error setting up reply:', e);
        }
    });

    // Admin closes ticket
    bot.action(/^close_ticket_(.+)$/, async (ctx) => {
        const ticketNum = ctx.match[1];

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });

            if (!ticket || ticket.status === 'CLOSED') {
                await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => { });
                return ctx.answerCbQuery('Обращение уже удалено или закрыто.', { show_alert: true });
            }

            await prisma.supportTicket.update({
                where: { ticketNum },
                data: { status: 'CLOSED', closedAt: new Date() }
            });
            adminReplyingTo.delete(ctx.chat!.id.toString());

            await ctx.answerCbQuery('Обращение успешно закрыто.');
            await ctx.editMessageText(`✅ <b>Обращение №${ticketNum} закрыто!</b>\nОт: ${ticket.authorName}`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });

            await ctx.telegram.sendMessage(ticket.authorId, `✅ <b>Ваше обращение №${ticketNum} было закрыто администратором.</b>\nЕсли у вас остались вопросы, вы можете создать новое обращение.`, { parse_mode: 'HTML' }).catch(() => { });
        } catch (e) {
            console.error('Error closing ticket:', e);
        }
    });
}

// Handle bug report/ticket/admin-reply/user-reply messages from the message handler
export async function handleTicketMessages(ctx: any, deps: BotDeps): Promise<boolean> {
    const tgIdStr = ctx.chat.id.toString();
    const text = (ctx.message as any).text;
    const { pendingBugReports, pendingSupportCreates, adminReplyingTo, userReplyingTo, prisma, bot, adminId } = deps;

    // Check Bug Reports First
    if (pendingBugReports.has(tgIdStr)) {
        if (text === '/cancel' || text === 'Отмена' || !text) {
            pendingBugReports.delete(tgIdStr);
            return true;
        }
        try {
            // Create a ticket for bug reports too (with type BUG)
            const ticketNum = Math.floor(10000 + Math.random() * 90000).toString();
            const authorName = ctx.from?.first_name || 'Пользователь';

            await prisma.supportTicket.create({
                data: {
                    ticketNum,
                    authorId: tgIdStr,
                    authorName,
                    message: text,
                    type: 'BUG',
                    status: 'OPEN'
                }
            });

            // Save initial message in history
            await prisma.ticketMessage.create({
                data: {
                    ticketNum,
                    senderId: tgIdStr,
                    senderName: authorName,
                    message: text
                }
            });

            await ctx.telegram.sendMessage(
                adminId,
                `🐛 <b>НОВЫЙ БАГ-РЕПОРТ №${ticketNum}</b>\n\n<b>От:</b> <a href="tg://user?id=${tgIdStr}">${authorName}</a>\n<b>Текст:</b>\n${text}`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🙋‍♂️ Взять в работу', callback_data: `take_ticket_${ticketNum}` }],
                            [{ text: '✉️ Ответить', callback_data: `reply_ticket_${ticketNum}` }]
                        ]
                    }
                }
            );
            pendingBugReports.delete(tgIdStr);
            await ctx.reply(`✅ Баг-репорт <b>№${ticketNum}</b> создан и отправлен разработчикам. Спасибо!\n\nВы можете отслеживать статус в разделе "📩 Мои обращения".`, { parse_mode: 'HTML' });
        } catch (e) {
            pendingBugReports.delete(tgIdStr);
            await ctx.reply('❌ Ошибка при отправке.');
        }
        return true;
    }

    // Check Support Ticket Create
    if (pendingSupportCreates.has(tgIdStr)) {
        if (text === '/cancel' || text === 'Отмена' || !text) {
            pendingSupportCreates.delete(tgIdStr);
            await ctx.reply('❌ Обращение отменено.');
            return true;
        }

        const ticketNum = Math.floor(10000 + Math.random() * 90000).toString();
        const authorName = ctx.from?.first_name || 'Пользователь';

        try {
            // Persist ticket to database
            await prisma.supportTicket.create({
                data: {
                    ticketNum,
                    authorId: tgIdStr,
                    authorName,
                    message: text,
                    type: 'SUPPORT',
                    status: 'OPEN'
                }
            });

            // Save initial message in history
            await prisma.ticketMessage.create({
                data: {
                    ticketNum,
                    senderId: tgIdStr,
                    senderName: authorName,
                    message: text
                }
            });
        } catch (e) {
            console.error('Error creating support ticket in DB:', e);
            await ctx.reply('❌ Ошибка при создании обращения.');
            pendingSupportCreates.delete(tgIdStr);
            return true;
        }

        pendingSupportCreates.delete(tgIdStr);

        const admins = await prisma.driver.findMany({ where: { role: 'ADMIN' } });
        let sentCount = 0;
        for (const admin of admins) {
            try {
                await bot.telegram.sendMessage(
                    admin.telegramId.toString(),
                    `🆘 <b>Новое обращение №${ticketNum}</b>\n\n<b>От:</b> <a href="tg://user?id=${tgIdStr}">${authorName}</a>\n<b>Сообщение:</b>\n${text}`,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🙋‍♂️ Взять в работу', callback_data: `take_ticket_${ticketNum}` }],
                                [{ text: '✉️ Ответить', callback_data: `reply_ticket_${ticketNum}` }]
                            ]
                        }
                    }
                );
                sentCount++;
            } catch (e) { }
        }

        await ctx.reply(`✅ Обращение <b>№${ticketNum}</b> создано и отправлено администрации.\nОжидайте ответа!\n\nОтслеживайте статус в разделе "📩 Мои обращения".`, {
            parse_mode: 'HTML'
        });
        return true;
    }

    // Check Admin Replying to a Ticket
    if (adminReplyingTo.has(tgIdStr)) {
        if (text === '/cancel' || text === 'Отмена' || !text) {
            adminReplyingTo.delete(tgIdStr);
            await ctx.reply('❌ Отправка ответа отменена.', { reply_markup: { remove_keyboard: true } });
            return true;
        }

        const ticketNum = adminReplyingTo.get(tgIdStr)!;

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });

            if (!ticket || ticket.status === 'CLOSED') {
                adminReplyingTo.delete(tgIdStr);
                await ctx.reply('❌ Обращение №' + ticketNum + ' не найдено или уже закрыто.', { reply_markup: { remove_keyboard: true } });
                return true;
            }

            // Save message to history
            const adminName = ctx.from?.first_name || 'Администратор';
            await prisma.ticketMessage.create({
                data: {
                    ticketNum,
                    senderId: tgIdStr,
                    senderName: adminName,
                    message: text
                }
            });

            // Send to user with reply button
            await ctx.telegram.sendMessage(
                ticket.authorId,
                `📩 <b>Ответ администрации (Обращение №${ticketNum}):</b>\n\n${text}`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✉️ Ответить', callback_data: `user_reply_ticket_${ticketNum}` }]
                        ]
                    }
                }
            );
            adminReplyingTo.delete(tgIdStr);

            await ctx.reply(`✅ Ответ успешно отправлен автору обращения №${ticketNum}.`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✉️ Написать еще', callback_data: `reply_ticket_${ticketNum}` }],
                        [{ text: '📜 История', callback_data: `view_ticket_history_${ticketNum}` }],
                        [{ text: '✅ Закрыть обращение', callback_data: `close_ticket_${ticketNum}` }]
                    ]
                }
            });
        } catch (e) {
            adminReplyingTo.delete(tgIdStr);
            await ctx.reply('❌ Ошибка при отправке ответа пользователю (возможно он заблокировал бота).');
        }
        return true;
    }

    // Check User Replying to a Ticket
    if (userReplyingTo.has(tgIdStr)) {
        if (text === '/cancel' || text === 'Отмена' || !text) {
            userReplyingTo.delete(tgIdStr);
            await ctx.reply('❌ Отправка ответа отменена.', { reply_markup: { remove_keyboard: true } });
            return true;
        }

        const ticketNum = userReplyingTo.get(tgIdStr)!;

        try {
            const ticket = await prisma.supportTicket.findUnique({ where: { ticketNum } });

            if (!ticket || ticket.status === 'CLOSED') {
                userReplyingTo.delete(tgIdStr);
                await ctx.reply('❌ Обращение №' + ticketNum + ' закрыто или не найдено.', { reply_markup: { remove_keyboard: true } });
                return true;
            }

            // Save message to history
            const userName = ctx.from?.first_name || 'Пользователь';
            await prisma.ticketMessage.create({
                data: {
                    ticketNum,
                    senderId: tgIdStr,
                    senderName: userName,
                    message: text
                }
            });

            // Send to admin
            const targetAdminId = ticket.adminId || adminId;
            await ctx.telegram.sendMessage(
                targetAdminId,
                `💬 <b>Ответ пользователя (Обращение №${ticketNum}):</b>\n\n<b>От:</b> <a href="tg://user?id=${tgIdStr}">${userName}</a>\n<b>Сообщение:</b>\n${text}`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✉️ Ответить', callback_data: `reply_ticket_${ticketNum}` }],
                            [{ text: '✅ Закрыть', callback_data: `close_ticket_${ticketNum}` }]
                        ]
                    }
                }
            );

            userReplyingTo.delete(tgIdStr);

            await ctx.reply(`✅ Ваш ответ по обращению №${ticketNum} отправлен администратору.`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✉️ Написать ещё', callback_data: `user_reply_ticket_${ticketNum}` }]
                    ]
                }
            });
        } catch (e) {
            userReplyingTo.delete(tgIdStr);
            await ctx.reply('❌ Ошибка при отправке ответа.');
        }
        return true;
    }

    return false;
}
