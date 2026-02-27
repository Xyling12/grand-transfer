import { BotDeps } from './types';
import { checkAuth } from './helpers';

export function registerTicketHandlers(deps: BotDeps) {
    const { bot, prisma, adminId, pendingBugReports, pendingSupportCreates, adminReplyingTo } = deps;

    // Bug Report Entry Point
    bot.hears('🛠 Найдена ошибка', async (ctx) => {
        const tgIdStr = ctx.chat.id.toString();
        pendingBugReports.add(tgIdStr);

        return ctx.reply(
            '🛠 <b>Сообщение об ошибке</b>\n\nПожалуйста, максимально подробно опишите ошибку, которую вы нашли. Ваше следующее сообщение будет отправлено тех. поддержке.\n\n<i>Отправьте /cancel для отмены.</i>',
            { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
        );
    });

    // Support System Entry Point
    bot.hears('🆘 Связь с администрацией', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role === 'PENDING' || role === 'BANNED') return;

        const tgIdStr = ctx.chat.id.toString();
        pendingSupportCreates.add(tgIdStr);

        return ctx.reply(
            '🆘 <b>Обращение в администрацию</b>\n\nНапишите ваш вопрос, проблему или предложение одним сообщением. Оно будет направлено всем дежурным администраторам диспетчерской службы.\n\n<i>Отправьте /cancel для отмены.</i>',
            { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
        );
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
                    [{ text: '✅ Закрыть обращение', callback_data: `close_ticket_${ticketNum}` }]
                ]
            });

            await ctx.telegram.sendMessage(ticket.authorId, `👨‍💻 <b>Администратор принял ваше обращение №${ticketNum} в работу.</b> Ожидайте ответа.`, { parse_mode: 'HTML' }).catch(() => { });
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

// Handle bug report/ticket/admin-reply messages from the message handler
export async function handleTicketMessages(ctx: any, deps: BotDeps): Promise<boolean> {
    const tgIdStr = ctx.chat.id.toString();
    const text = (ctx.message as any).text;
    const { pendingBugReports, pendingSupportCreates, adminReplyingTo, prisma, bot, adminId } = deps;

    // Check Bug Reports First
    if (pendingBugReports.has(tgIdStr)) {
        if (text === '/cancel' || text === 'Отмена' || !text) {
            pendingBugReports.delete(tgIdStr);
            return true;
        }
        try {
            await ctx.telegram.sendMessage(
                adminId,
                `🚨 <b>НОВЫЙ БАГ РЕПОРТ</b>\n\n<b>От:</b> <a href="tg://user?id=${tgIdStr}">${ctx.from?.first_name || 'Пользователь'}</a>\n<b>Текст:</b>\n${text}`,
                { parse_mode: 'HTML' }
            );
            pendingBugReports.delete(tgIdStr);
            await ctx.reply('✅ Ваше сообщение об ошибке успешно отправлено разработчикам. Спасибо!');
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
                    status: 'OPEN'
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
                            inline_keyboard: [[{ text: '🙋‍♂️ Взять в работу', callback_data: `take_ticket_${ticketNum}` }]]
                        }
                    }
                );
                sentCount++;
            } catch (e) { }
        }

        await ctx.reply(`✅ Обращение <b>№${ticketNum}</b> создано и отправлено администрации.\nОжидайте ответа!`, {
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

            await ctx.telegram.sendMessage(
                ticket.authorId,
                `📩 <b>Ответ администрации (Обращение №${ticketNum}):</b>\n\n${text}`,
                { parse_mode: 'HTML' }
            );
            adminReplyingTo.delete(tgIdStr);

            await ctx.reply(`✅ Ответ успешно отправлен автору обращения №${ticketNum}.`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✉️ Написать еще', callback_data: `reply_ticket_${ticketNum}` }],
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

    return false;
}
