import { Markup } from 'telegraf';
import { BotDeps } from './types';
import { checkAuth, formatOrderMessage, translateTariff, translateStatus, getMainMenu, getProtectContent, getMapDeepLink, getMapWebLink, replyWithMenu } from './helpers';
import { cities } from '../../src/data/cities';
import * as xlsx from 'xlsx';

export function registerOrderHandlers(deps: BotDeps) {
    const { bot, prisma, adminId } = deps;

    // --- My Orders ---
    bot.hears(['🚗 Мои заказы', '🚗 Мои заявки'], async (ctx) => {
        const { auth, dbId, role } = await checkAuth(ctx, deps);
        if (!auth || !dbId) return;

        try {
            const whereClause = role === 'DISPATCHER' ? {
                OR: [
                    { dispatcherId: dbId },
                    { driverId: dbId, status: 'TAKEN' }
                ]
            } : { driverId: dbId, status: 'TAKEN' };

            const myOrders = await prisma.order.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { driver: true, dispatcher: true }
            });

            if (myOrders.length === 0) {
                return ctx.reply('У вас пока нет активных взятых или курируемых заявок.', { protect_content: true });
            }

            await ctx.reply('🚗 <b>Ваши активные заявки:</b>', { parse_mode: 'HTML' });

            const protectContentGlobal = await getProtectContent(deps, role!);

            for (const o of myOrders) {
                const msg = formatOrderMessage(o, role!);

                const buttons: any[] = [];
                if (o.status === 'TAKEN' && o.driverId === dbId) {
                    buttons.push([{ text: '✅ Заявка выполнена', callback_data: `complete_order_${o.id}` }]);
                }
                // Dispatcher/Admin action buttons
                if ((role === 'DISPATCHER' || role === 'ADMIN') && (o.status === 'PROCESSING' || o.status === 'DISPATCHED' || o.status === 'TAKEN')) {
                    buttons.push([{ text: '📋 Полная заявка', callback_data: `full_order_${o.id}` }]);
                    if (o.status !== 'TAKEN') {
                        buttons.push([{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${o.id}` }]);
                    }
                    buttons.push([{ text: '🏁 Завершить заявку', callback_data: `complete_order_${o.id}` }]);
                }
                // Map links
                buttons.push([{ text: '📱 Маршрут (приложение)', url: getMapDeepLink(o.fromCity, o.toCity) }]);
                buttons.push([{ text: '🌐 Маршрут (браузер)', url: getMapWebLink(o.fromCity, o.toCity) }]);

                await ctx.replyWithHTML(msg, {
                    protect_content: protectContentGlobal,
                    reply_markup: { inline_keyboard: buttons }
                });
            }
        } catch (err) {
            console.error('MY_ORDERS ERROR:', err);
            ctx.reply('❌ Ошибка при получении ваших заказов.', { protect_content: true });
        }
    });

    // --- Order History ---
    bot.hears('📚 История заявок', async (ctx) => {
        const { auth, dbId, role } = await checkAuth(ctx, deps);
        if (!auth || !dbId) return;

        try {
            const whereClause = role === 'DISPATCHER' ? {
                OR: [
                    { dispatcherId: dbId },
                    { driverId: dbId, status: { in: ['COMPLETED', 'CANCELLED'] } }
                ]
            } : { driverId: dbId, status: { in: ['COMPLETED', 'CANCELLED'] } };

            const historyOrders = await prisma.order.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { driver: true, dispatcher: true }
            });

            const finalOrders = historyOrders.filter((o: any) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

            if (finalOrders.length === 0) {
                return ctx.reply('У вас пока нет завершенных или отмененных заявок.', { protect_content: true });
            }

            await ctx.reply('📚 <b>История ваших заявок (последние 20):</b>', { parse_mode: 'HTML' });

            for (const o of finalOrders) {
                const msg = formatOrderMessage(o, role!);
                await ctx.replyWithHTML(msg, { protect_content: role !== 'ADMIN' });
            }
        } catch (err) {
            ctx.reply('❌ Ошибка при получении истории.', { protect_content: true });
        }
    });

    // --- Active Orders ---
    bot.hears('👀 Активные заявки', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return;

        try {
            const activeOrders = await prisma.order.findMany({
                where: { status: { in: ['TAKEN', 'NEW', 'DISPATCHED', 'PROCESSING'] } },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            if (activeOrders.length === 0) {
                return ctx.reply('Сейчас нет активных заявок.', { protect_content: true });
            }

            const allDrivers = await prisma.driver.findMany();
            const driverMap = new Map();
            allDrivers.forEach((d: any) => {
                const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
                driverMap.set(d.id, name);
            });

            let msg = '👀 <b>Активные заявки (в работе):</b>\n\n';
            const inlineButtons: any[] = [];

            activeOrders.forEach((o: any) => {
                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
                const driverName = o.driverId ? driverMap.get(o.driverId) || 'Неизвестен' : 'Неизвестен';

                let statusEmoji = o.status === 'NEW' ? '🔵' : (o.status === 'DISPATCHED' ? '🟡' : (o.status === 'PROCESSING' ? '🟣' : '🟢'));
                let driverInfo = '';

                if (o.status === 'TAKEN') {
                    driverInfo = `\n👨‍✈️ <b>Исполнитель (Водитель):</b> ${driverName}`;
                } else if (o.status === 'PROCESSING') {
                    driverInfo = `\n🎧 <b>Исполнитель (Диспетчер):</b> ${o.dispatcherId ? (driverMap.get(o.dispatcherId) || 'Неизвестен') : 'Неизвестен'}`;
                } else {
                    driverInfo = `\n📌 <b>Статус:</b> В поиске`;
                }

                msg += `${statusEmoji} <b>Заявка № ${o.id}</b> (${dateStr})\n` +
                    `📍 <b>Маршрут:</b> ${o.fromCity} — ${o.toCity}\n` +
                    `💰 <b>Сумма:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}` +
                    `${driverInfo}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n`;

                inlineButtons.push(Markup.button.callback(`📄 Заявка № ${o.id}`, `full_order_${o.id}`));
            });

            const keyboardRows = [];
            for (let i = 0; i < inlineButtons.length; i += 2) {
                keyboardRows.push(inlineButtons.slice(i, i + 2));
            }

            const protectContentGlobal = await getProtectContent(deps, role!);

            ctx.replyWithHTML(msg, {
                protect_content: protectContentGlobal,
                reply_markup: { inline_keyboard: keyboardRows }
            });
        } catch (err: any) {
            ctx.reply(`❌ Ошибка при получении активных заявок.\nТех. информация: ${err.message}`, { protect_content: true });
        }
    });

    // --- Completed Orders ---
    bot.hears('✅ Выполненные заявки', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        try {
            const completedOrders = await prisma.order.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { driver: true, dispatcher: true }
            });

            if (completedOrders.length === 0) {
                return ctx.reply('Нет выполненных заявок.', { protect_content: true });
            }

            await ctx.reply('✅ <b>Последние 20 выполненных заявок:</b>', { parse_mode: 'HTML' });

            for (const o of completedOrders) {
                const msg = formatOrderMessage(o, role!);
                await ctx.replyWithHTML(msg, { protect_content: false });
            }
        } catch (err) {
            ctx.reply('❌ Ошибка при получении заявок.', { protect_content: true });
        }
    });

    // --- Full Order View ---
    bot.action(/^full_order_(\d+)$/, async (ctx) => {
        const { auth, role, dbId } = await checkAuth(ctx, deps);
        if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

        const orderId = parseInt(ctx.match[1], 10);
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return ctx.answerCbQuery('Заявка не найдена', { show_alert: true });

            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
            const scheduledStr = (order as any).scheduledDate || 'Сразу';
            const msg = `
📋 <b>ПОЛНАЯ ЗАЯВКА № ${order.id}</b>
<i>(Создана ${dateStr})</i>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}
📅 <b>Дата/Время:</b> ${scheduledStr}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.customerPhone}
📌 <b>Текущий Статус:</b> ${translateStatus(order.status, role)}
            `.trim();

            const keyboardButtons: any[] = [];
            if (order.status === 'NEW' || order.status === 'PROCESSING') {
                keyboardButtons.push([{ text: '🎧 Взять в работу', callback_data: `take_work_${order.id}` }]);
                keyboardButtons.push([{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${order.id}` }]);
            } else if (order.status === 'TAKEN') {
                keyboardButtons.push([{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }]);
            }
            // Cancel and Edit for non-completed/cancelled orders
            if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
                keyboardButtons.push([
                    { text: '✏️ Редактировать', callback_data: `edit_order_${order.id}` },
                    { text: '❌ Отменить', callback_data: `cancel_order_${order.id}` }
                ]);
            }
            keyboardButtons.push([{ text: '📱 Маршрут (приложение)', url: getMapDeepLink(order.fromCity, order.toCity) }]);
            keyboardButtons.push([{ text: '🌐 Маршрут (браузер)', url: getMapWebLink(order.fromCity, order.toCity) }]);

            const protectContentGlobal = await getProtectContent(deps, role!);

            await ctx.replyWithHTML(msg, {
                reply_markup: { inline_keyboard: keyboardButtons },
                protect_content: protectContentGlobal
            });
            await ctx.answerCbQuery();
        } catch (err) {
            console.error('full_order error:', err);
            ctx.answerCbQuery('Ошибка получения заявки. Возможно, она была удалена.', { show_alert: true });
        }
    });

    // --- Cancel Order (Step 1: Ask confirmation) ---
    bot.action(/^cancel_order_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

        const orderId = ctx.match[1];
        await ctx.answerCbQuery();
        await ctx.replyWithHTML(
            `⚠️ <b>Отмена заявки №${orderId}</b>\n\nПодтвердите, что вы уведомили:\n\n☑️ Водитель уведомлён?\n☑️ Клиент уведомлён?`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Оба уведомлены — Отменить', callback_data: `confirm_cancel_both_${orderId}` }],
                        [{ text: '📞 Только клиент уведомлён', callback_data: `confirm_cancel_client_${orderId}` }],
                        [{ text: '🚗 Только водитель уведомлён', callback_data: `confirm_cancel_driver_${orderId}` }],
                        [{ text: '🔙 Отмена', callback_data: `cancel_dismiss_${orderId}` }]
                    ]
                }
            }
        );
    });

    // --- Cancel Order (Step 2: Confirm & Execute) ---
    bot.action(/^confirm_cancel_(both|client|driver)_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

        const notifyType = ctx.match[1];
        const orderId = parseInt(ctx.match[2], 10);
        const tgIdStr = ctx.chat!.id.toString();
        const actorName = ctx.from?.first_name || 'Администратор';

        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order || order.status === 'CANCELLED') {
                return ctx.answerCbQuery('Заявка уже отменена или не найдена.', { show_alert: true });
            }

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledBy: tgIdStr,
                    clientNotified: notifyType === 'both' || notifyType === 'client',
                    driverNotified: notifyType === 'both' || notifyType === 'driver'
                }
            });

            // Log to AuditLog
            try {
                await prisma.auditLog.create({
                    data: {
                        action: 'CANCEL_ORDER',
                        actorId: tgIdStr,
                        actorName,
                        targetId: orderId.toString(),
                        targetName: `${order.fromCity} → ${order.toCity}`,
                        details: `Клиент: ${notifyType === 'both' || notifyType === 'client' ? 'уведомлён' : 'НЕ уведомлён'}, Водитель: ${notifyType === 'both' || notifyType === 'driver' ? 'уведомлён' : 'НЕ уведомлён'}`
                    }
                });
            } catch (e) { /* AuditLog may not exist yet */ }

            const notifyText = notifyType === 'both' ? 'Оба уведомлены' :
                notifyType === 'client' ? 'Только клиент' : 'Только водитель';

            await ctx.answerCbQuery('Заявка отменена!');
            await ctx.editMessageText(
                `❌ <b>Заявка №${orderId} отменена</b>\n\n` +
                `📍 ${order.fromCity} → ${order.toCity}\n` +
                `👤 Клиент: ${order.customerName}\n` +
                `📞 ${order.customerPhone}\n\n` +
                `✅ Уведомлены: <b>${notifyText}</b>\n` +
                `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
                { parse_mode: 'HTML' }
            );
        } catch (err) {
            console.error('cancel_order error:', err);
            ctx.answerCbQuery('Ошибка при отмене.', { show_alert: true });
        }
    });

    // --- Cancel Dismiss ---
    bot.action(/^cancel_dismiss_(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery('Отмена отменена');
        try { await ctx.deleteMessage(); } catch (e) { }
    });

    // --- Edit Order (Field Selection) ---
    bot.action(/^edit_order_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

        const orderId = ctx.match[1];
        await ctx.answerCbQuery();
        await ctx.replyWithHTML(
            `✏️ <b>Редактирование заявки №${orderId}</b>\n\nВыберите поле для изменения:`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📍 Откуда', callback_data: `editfield_fromCity_${orderId}` }, { text: '🏁 Куда', callback_data: `editfield_toCity_${orderId}` }],
                        [{ text: '🚕 Тариф', callback_data: `editfield_tariff_${orderId}` }, { text: '👥 Пассажиры', callback_data: `editfield_passengers_${orderId}` }],
                        [{ text: '💰 Стоимость', callback_data: `editfield_priceEstimate_${orderId}` }, { text: '📅 Дата/Время', callback_data: `editfield_scheduledDate_${orderId}` }],
                        [{ text: '📝 Комментарий', callback_data: `editfield_comments_${orderId}` }],
                        [{ text: '👤 Имя клиента', callback_data: `editfield_customerName_${orderId}` }, { text: '📞 Телефон', callback_data: `editfield_customerPhone_${orderId}` }],
                        [{ text: '🔙 Отмена', callback_data: `cancel_dismiss_0` }]
                    ]
                }
            }
        );
    });

    // --- Edit Field (Ask for new value) ---
    const fieldNames: Record<string, string> = {
        fromCity: 'Откуда', toCity: 'Куда', tariff: 'Тариф', passengers: 'Пассажиры',
        priceEstimate: 'Стоимость', scheduledDate: 'Дата/Время', comments: 'Комментарий',
        customerName: 'Имя клиента', customerPhone: 'Телефон'
    };

    bot.action(/^editfield_(\w+)_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

        const field = ctx.match[1];
        const orderId = ctx.match[2];
        const tgIdStr = ctx.chat!.id.toString();

        deps.pendingEdits.set(tgIdStr, { orderId: parseInt(orderId, 10), field });

        await ctx.answerCbQuery();
        await replyWithMenu(ctx, deps,
            `✏️ Введите новое значение для поля <b>${fieldNames[field] || field}</b> (заявка №${orderId}):\n\n<i>Отправьте /cancel для отмены.</i>`,
            { parse_mode: 'HTML' }
        );
    });

    // --- New Orders (without dispatcher) ---
    bot.hears('🆕 Заказы без работы', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'DISPATCHER' && role !== 'ADMIN')) return;

        try {
            const newOrders = await prisma.order.findMany({
                where: { status: 'NEW' },
                include: { dispatcher: true, driver: true },
                orderBy: { createdAt: 'desc' }
            });

            if (newOrders.length === 0) {
                return ctx.reply('Нет новых заявок (status: NEW). Скоро появятся!');
            }

            let msg = '🆕 <b>Заявки без диспетчера (Новые с сайта):</b>\n\n';
            const inlineButtons: any[] = [];

            newOrders.forEach((o: any) => {
                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
                msg += `🔵 <b>Заявка № ${o.id}</b> (${dateStr})\n` +
                    `📍 <b>Маршрут:</b> ${o.fromCity} — ${o.toCity}\n` +
                    `💰 <b>Сумма:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n` +
                    `👤 <b>Клиент:</b> ${o.customerName}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n`;

                inlineButtons.push(Markup.button.callback(`📄 Заявка № ${o.id}`, `full_order_${o.id}`));
            });

            const keyboardRows = [];
            for (let i = 0; i < inlineButtons.length; i += 2) {
                keyboardRows.push(inlineButtons.slice(i, i + 2));
            }

            await ctx.replyWithHTML(msg, {
                reply_markup: { inline_keyboard: keyboardRows },
                protect_content: role !== 'ADMIN'
            });

        } catch (e) {
            console.error(e);
            ctx.reply('Ошибка сервера базы данных.');
        }
    });

    // --- Available Orders for Drivers ---
    bot.hears('📋 Доступные заявки', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth) return;

        try {
            const available = await prisma.order.findMany({
                where: {
                    status: { in: ['DISPATCHED', 'NEW'] },
                    driverId: null
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            if (available.length === 0) {
                return ctx.reply('📋 Нет доступных заявок. Ожидайте новых заказов!', { protect_content: true });
            }

            let msg = `📋 <b>Доступные заявки (${available.length}):</b>\n\n`;
            const inlineButtons: any[] = [];

            for (const o of available) {
                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
                msg += `🔵 <b>Заявка № ${o.id}</b> (${dateStr})\n` +
                    `📍 <b>Маршрут:</b> ${o.fromCity} — ${o.toCity}\n` +
                    `🚕 <b>Тариф:</b> ${translateTariff(o.tariff)}\n` +
                    `💰 <b>Сумма:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n`;

                inlineButtons.push([{ text: `✅ Забрать заявку № ${o.id}`, callback_data: `take_order_${o.id}` }]);
            }

            await ctx.replyWithHTML(msg, {
                reply_markup: { inline_keyboard: inlineButtons },
                protect_content: role !== 'ADMIN'
            });
        } catch (e) {
            console.error(e);
            ctx.reply('❌ Ошибка получения заявок.', { protect_content: true });
        }
    });

    // --- Dispatch Order to Drivers ---
    bot.action(/^dispatch_order_(\d+)$/, async (ctx) => {
        const { auth, role, dbId } = await checkAuth(ctx, deps);
        if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) {
            return ctx.answerCbQuery('У вас нет прав для отправки заявки водителям.', { show_alert: true });
        }

        const orderId = parseInt(ctx.match[1], 10);
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });

            if (!order) {
                return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
            }

            if (order.status !== 'NEW' && order.status !== 'PROCESSING') {
                const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
                await ctx.editMessageText(txt + '\n\n❌ <i>Эта заявка уже обработана или взята водителем.</i>', { parse_mode: 'HTML' });
                return ctx.answerCbQuery('Уже обработано!', { show_alert: true });
            }

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'DISPATCHED', dispatcherId: dbId }
            });

            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            const dispatcherInfo = `\n\n✅ <b>ВЫ ОТПРАВИЛИ ЭТУ ЗАЯВКУ ВОДИТЕЛЯМ</b>`;
            await ctx.editMessageText(txt + dispatcherInfo, { parse_mode: 'HTML' });
            await ctx.answerCbQuery('Заявка отправлена водителям!', { show_alert: true });


            const driverMessage = `
🚕 <b>Новый заказ для водителей!</b>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
<i>(Остальные контакты будут доступны после принятия заявки)</i>

<i>№ заказа: ${order.id}</i>
            `.trim();

            const keyboard = {
                inline_keyboard: [
                    [{ text: '✅ Забрать заявку', callback_data: `take_order_${order.id}` }],
                    [{ text: '📱 Маршрут (приложение)', url: getMapDeepLink(order.fromCity, order.toCity) }],
                    [{ text: '🌐 Маршрут (браузер)', url: getMapWebLink(order.fromCity, order.toCity) }]
                ]
            };

            const protectContentGlobal = await getProtectContent(deps, 'DRIVER');

            const drivers = await prisma.driver.findMany({
                where: { status: 'APPROVED', role: { in: ['DRIVER', 'ADMIN'] } }
            });

            for (const drv of drivers) {
                try {
                    const shouldProtect = drv.role === 'ADMIN' ? false : protectContentGlobal;

                    const sentMsg = await bot.telegram.sendMessage(
                        Number(drv.telegramId),
                        driverMessage,
                        { parse_mode: 'HTML', reply_markup: keyboard, protect_content: shouldProtect }
                    );

                    await prisma.broadcastMessage.create({
                        data: {
                            orderId: order.id,
                            telegramId: BigInt(drv.telegramId),
                            messageId: sentMsg.message_id
                        }
                    });
                } catch (err) {
                    console.error(`Failed to send driver dispatch to ${drv.telegramId}:`, err);
                }
            }

        } catch (err) {
            console.error('Dispatch error:', err);
            ctx.answerCbQuery('Произошла ошибка базы данных.');
        }
    });

    // --- Take into Work (Dispatcher) ---
    bot.action(/^take_work_(\d+)$/, async (ctx) => {
        const { auth, role, dbId } = await checkAuth(ctx, deps);
        if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) {
            return ctx.answerCbQuery('У вас нет прав для взятия заявки диспетчером.', { show_alert: true });
        }

        const orderId = parseInt(ctx.match[1], 10);
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });

            if (!order) {
                return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
            }

            if (order.status !== 'NEW') {
                return ctx.answerCbQuery('Заявка уже в работе или отправлена водителям!', { show_alert: true });
            }

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PROCESSING', dispatcherId: dbId, takenAt: new Date() }
            });

            const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

            try {
                const bms = await prisma.broadcastMessage.findMany({ where: { orderId } });

                for (const bm of bms) {
                    try {
                        const isSelf = ctx.chat && bm.telegramId === BigInt(ctx.chat.id);


                        if (isSelf) {
                            const newText = `
🚨 <b>Новая заявка на трансфер!</b>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Расчетная стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}

<i>№ заказа: ${order.id}</i>

🎧 <b>Взял в работу:</b> ${takerName}
`.trim();

                            const newKeyboard = {
                                inline_keyboard: [
                                    [{ text: '📋 Полная заявка', callback_data: `full_order_${order.id}` }],
                                    [{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${order.id}` }],
                                    [{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }],
                                    [{ text: '📱 Маршрут (приложение)', url: getMapDeepLink(order.fromCity, order.toCity) }],
                                    [{ text: '🌐 Маршрут (браузер)', url: getMapWebLink(order.fromCity, order.toCity) }]
                                ]
                            };

                            await bot.telegram.editMessageText(
                                Number(bm.telegramId),
                                bm.messageId,
                                undefined,
                                newText,
                                { parse_mode: 'HTML', reply_markup: newKeyboard }
                            );
                        } else {
                            await bot.telegram.deleteMessage(Number(bm.telegramId), bm.messageId);
                        }
                    } catch (editErr) {
                        console.error(`Failed to update or delete msg for ${bm.telegramId}:`, editErr);
                    }
                }
            } catch (dbErr) {
                console.error('Failed to get broadcast messages:', dbErr);
            }

            await ctx.answerCbQuery('Вы взяли заявку в работу!', { show_alert: true });

        } catch (err) {
            console.error('Take work error:', err);
            ctx.answerCbQuery('Произошла ошибка при взятии в работу.');
        }
    });

    // --- Take Order (Driver) ---
    bot.action(/^take_order_(\d+)$/, async (ctx) => {
        const { auth, dbId } = await checkAuth(ctx, deps);
        if (!auth || !dbId) {
            return ctx.answerCbQuery('У вас нет прав для взятия заявки.', { show_alert: true });
        }

        const orderId = parseInt(ctx.match[1], 10);
        try {
            // Check if driver already has an active order
            const existingOrder = await prisma.order.findFirst({
                where: { driverId: dbId, status: 'TAKEN' }
            });
            if (existingOrder) {
                return ctx.answerCbQuery('⚠️ У вас уже есть активная заявка №' + existingOrder.id + '. Завершите её перед взятием новой.', { show_alert: true });
            }

            const order = await prisma.order.findUnique({ where: { id: orderId } });

            if (!order) {
                return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
            }

            if (order.status !== 'DISPATCHED' && order.status !== 'NEW') {
                const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
                await ctx.editMessageText(txt + '\n\n❌ <i>Заявка уже взята в работу другим водителем.</i>', { parse_mode: 'HTML' });
                return ctx.answerCbQuery('Заявка уже взята!', { show_alert: true });
            }

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'TAKEN', driverId: dbId, takenAt: new Date() }
            });

            const fullOrderInfo = `✅ <b>ВЫ ВЗЯЛИ ЭТУ ЗАЯВКУ В РАБОТУ</b>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}
🗓 <b>Дата/Время:</b> ${order.scheduledDate || 'Сразу'}
📝 <b>Комментарий:</b> ${order.comments || 'Нет'}

👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> <code>${order.customerPhone}</code>

<i>№ заказа: ${order.id}</i>`;

            await ctx.editMessageText(fullOrderInfo, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }],
                        [{ text: '📱 Маршрут (приложение)', url: getMapDeepLink(order.fromCity, order.toCity) }],
                        [{ text: '🌐 Маршрут (браузер)', url: getMapWebLink(order.fromCity, order.toCity) }]
                    ]
                }
            });
            await ctx.answerCbQuery('Вы успешно взяли заявку!', { show_alert: true });

            try {
                const bms = await prisma.broadcastMessage.findMany({ where: { orderId } });
                const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

                const staffToNotify = await prisma.driver.findMany({
                    where: {
                        status: 'APPROVED',
                        role: { in: ['ADMIN', 'DISPATCHER'] }
                    }
                });

                const notifyPromises = staffToNotify.map(async (staff: any) => {
                    if (staff.telegramId === BigInt(ctx.chat?.id || 0)) return;

                    const adminTxt = `🚨 <b>Заявка № ${orderId} ВЗЯТА В РАБОТУ</b>\n\n👨‍✈️ Водитель: <b>${takerName}</b>\n📍 Маршрут: ${order.fromCity} — ${order.toCity}\n💰 ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Без оценки'}`;
                    return bot.telegram.sendMessage(Number(staff.telegramId), adminTxt, { parse_mode: 'HTML' }).catch(() => { });
                });
                await Promise.all(notifyPromises);

                for (const bm of bms) {
                    if (ctx.chat && bm.telegramId === BigInt(ctx.chat.id)) continue;
                    try {
                        await bot.telegram.deleteMessage(Number(bm.telegramId), bm.messageId);
                    } catch (delErr) {
                        console.error(`Failed to delete message for ${bm.telegramId}:`, delErr);
                    }
                }
            } catch (dbErr) {
                console.error('Failed to cleanup broadcast messages:', dbErr);
            }

        } catch (err) {
            console.error('Take_order error:', err);
            ctx.answerCbQuery('Произошла ошибка при попытке взять заявку.');
        }
    });

    // --- Complete Order ---
    bot.action(/^complete_order_(\d+)$/, async (ctx) => {
        const { auth, role, dbId } = await checkAuth(ctx, deps);
        if (!auth || !dbId) return ctx.answerCbQuery('Нет прав', { show_alert: true });

        const orderId = parseInt(ctx.match[1], 10);
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return ctx.answerCbQuery('Заявка не найдена', { show_alert: true });

            if (order.status !== 'TAKEN' && order.status !== 'PROCESSING') {
                return ctx.answerCbQuery('Заявка не находится в работе!', { show_alert: true });
            }

            const isAssignedDriver = order.driverId === dbId;
            const isAssignedDispatcher = order.dispatcherId === dbId;

            if (!isAssignedDriver && !isAssignedDispatcher && role !== 'ADMIN') {
                return ctx.answerCbQuery('Только назначенный исполнитель может завершить заявку.', { show_alert: true });
            }

            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });

            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            const cleanTxt = txt.replace(/Для завершения заказа нажмите кнопку ниже:/i, '').trim();

            await ctx.editMessageText(cleanTxt + '\n\n✅ <b>ЗАЯВКА УСПЕШНО ВЫПОЛНЕНА</b>', { parse_mode: 'HTML', reply_markup: undefined });
            await ctx.answerCbQuery('Заявка выполнена!', { show_alert: true });

            const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

            if (order.dispatcherId && !isAssignedDispatcher) {
                const disp = await prisma.driver.findUnique({ where: { id: order.dispatcherId } });
                if (disp && disp.telegramId !== BigInt(ctx.chat?.id || 0)) {
                    const dispMsg = `✅ <b>Заявка № ${order.id} ВЫПОЛНЕНА</b>\n\n👨‍✈️ Исполнитель: <b>${takerName}</b>\n📍 Маршрут: ${order.fromCity} — ${order.toCity}\n💰 ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Без оценки'}\n👤 Клиент: ${order.customerName}\n📞 Телефон: <code>${order.customerPhone}</code>`;
                    await bot.telegram.sendMessage(Number(disp.telegramId), dispMsg, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📋 Полная заявка', callback_data: `full_order_${order.id}` }],
                                [{ text: '📞 Обратная связь с клиентом', callback_data: `feedback_call_${order.id}` }]
                            ]
                        }
                    }).catch(() => { });
                }
            }

            const admins = await prisma.driver.findMany({ where: { status: 'APPROVED', role: 'ADMIN' } });
            for (const admin of admins) {
                if (admin.id !== order.dispatcherId && admin.telegramId !== BigInt(ctx.chat?.id || 0)) {
                    const adminMsg = `✅ <b>Заявка № ${order.id} ЗАКРЫТА</b>\n\nЗакрыл(а): <b>${takerName}</b>\nМаршрут: ${order.fromCity} — ${order.toCity}`;
                    await bot.telegram.sendMessage(Number(admin.telegramId), adminMsg, { parse_mode: 'HTML' }).catch(() => { });
                }
            }

        } catch (err) {
            console.error('Complete_order error:', err);
            ctx.answerCbQuery('Произошла ошибка при завершении заявки.');
        }
    });

    // --- Feedback Call (Dispatcher — call client) ---
    bot.action(/^feedback_call_(\d+)$/, async (ctx) => {
        const { auth } = await checkAuth(ctx, deps);
        if (!auth) return ctx.answerCbQuery('Нет прав', { show_alert: true });

        const orderId = parseInt(ctx.match[1], 10);
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return ctx.answerCbQuery('Заявка не найдена', { show_alert: true });

            await ctx.answerCbQuery();
            await ctx.reply(
                `📞 <b>Обратная связь по заявке №${orderId}</b>\n\n👤 <b>Клиент:</b> ${order.customerName}\n📱 <b>Телефон:</b> <code>${order.customerPhone}</code>\n\n<i>Нажмите на номер телефона для копирования и позвоните клиенту.</i>`,
                { parse_mode: 'HTML', protect_content: true }
            );
        } catch (err) {
            console.error('Feedback call error:', err);
            ctx.answerCbQuery('Ошибка');
        }
    });

    // --- Statistics (with period filter) ---
    bot.hears('📊 Статистика', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DRIVER')) return;

        await ctx.replyWithHTML('📊 <b>Статистика сервиса</b>\n\nВыберите период:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📅 Сегодня', callback_data: 'stats_day' }, { text: '📅 Неделя', callback_data: 'stats_week' }],
                    [{ text: '📅 Месяц', callback_data: 'stats_month' }, { text: '📅 Всё время', callback_data: 'stats_all' }]
                ]
            }
        });
    });

    bot.action(/^stats_(day|week|month|all)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DRIVER')) return ctx.answerCbQuery('Нет прав');

        const period = ctx.match[1];
        let dateFilter: Date | null = null;
        let periodLabel = 'За всё время';

        const now = new Date();
        if (period === 'day') {
            dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            periodLabel = 'Сегодня';
        } else if (period === 'week') {
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            periodLabel = 'За неделю';
        } else if (period === 'month') {
            dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
            periodLabel = 'За месяц';
        }

        try {
            const where = dateFilter ? { createdAt: { gte: dateFilter } } : {};

            const totalOrders = await prisma.order.count({ where });
            const completedOrders = await prisma.order.count({ where: { ...where, status: 'COMPLETED' } });
            const cancelledOrders = await prisma.order.count({ where: { ...where, status: 'CANCELLED' } });
            const sumResult = await prisma.order.aggregate({ where, _sum: { priceEstimate: true } });
            const completedSum = await prisma.order.aggregate({ where: { ...where, status: 'COMPLETED' }, _sum: { priceEstimate: true } });

            const tariffGroups = await prisma.order.groupBy({
                by: ['tariff'],
                where,
                _count: { tariff: true },
                orderBy: { _count: { tariff: 'desc' } }
            });

            let tariffStatsStr = '';
            if (tariffGroups.length > 0) {
                tariffStatsStr = '\n<b>Заказов по тарифам:</b>\n' + tariffGroups.map((t: any) => {
                    return `- ${translateTariff(t.tariff)}: ${t._count.tariff} шт.`;
                }).join('\n') + '\n────────────────';
            }

            const msg = `
📊 <b>Статистика — ${periodLabel}</b>
────────────────
📋 Всего заявок: ${totalOrders}
✅ Выполнено: ${completedOrders}
❌ Отменено: ${cancelledOrders}
💰 Общая сумма: ~${sumResult._sum.priceEstimate || 0} ₽
💵 Выполненные: ~${completedSum._sum.priceEstimate || 0} ₽
────────────────${tariffStatsStr}`.trim();

            await ctx.answerCbQuery();
            await ctx.editMessageText(msg, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📅 Сегодня', callback_data: 'stats_day' }, { text: '📅 Неделя', callback_data: 'stats_week' }],
                        [{ text: '📅 Месяц', callback_data: 'stats_month' }, { text: '📅 Всё время', callback_data: 'stats_all' }]
                    ]
                }
            });
        } catch (e) {
            console.error('Stats error:', e);
            ctx.answerCbQuery('Ошибка при получении статистики.', { show_alert: true });
        }
    });

    // --- Excel Export ---
    bot.hears('📥 Выгрузить EXCEL', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;
        try {
            await ctx.reply('⏳ Формирую отчеты, подождите...');

            const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
            const drivers = await prisma.driver.findMany();
            const driverMap = new Map();
            drivers.forEach((d: any) => {
                const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
                driverMap.set(d.id, name);
            });

            const ordersByMonth = new Map<string, any[][]>();
            const headers = ["ID", "Дата", "Откуда", "Куда", "Тариф", "Пассажиров", "Сумма", "Имя Клиента", "Телефон", "Комментарий", "Дата/Время поездки", "Исполнитель", "Статус"];

            orders.forEach((o: any) => {
                const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
                let monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
                monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '').trim();

                if (!ordersByMonth.has(monthName)) {
                    ordersByMonth.set(monthName, [[...headers]]);
                }

                const dateStr = dateObj.toLocaleString('ru-RU');
                const driverStr = o.driverId ? (driverMap.get(o.driverId) || o.driverId) : (o.dispatcherId ? (driverMap.get(o.dispatcherId) + ' (Диспетчер)') : '');

                ordersByMonth.get(monthName)!.push([
                    o.id.toString(), dateStr, o.fromCity, o.toCity, translateTariff(o.tariff),
                    o.passengers.toString(), o.priceEstimate ? o.priceEstimate.toString() : '',
                    o.customerName, o.customerPhone, o.comments || '', o.scheduledDate || '', driverStr, translateStatus(o.status)
                ]);
            });

            const driversData = [
                ["ID (БД)", "TG ID", "Юзернейм", "Имя", "Телефон", "ПТС", "Роль", "Статус", "ФотоПрав_ФайлID", "ФотоАвто_ФайлID", "Дата регистрации"]
            ];

            drivers.forEach((d: any) => {
                const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleString('ru-RU') : '';
                driversData.push([
                    d.id, d.telegramId.toString(), d.username || '', d.firstName || '',
                    d.phone || '', d.ptsNumber || '', d.role, d.status,
                    d.licensePhotoId || '', d.carPhotoId || '', dateStr
                ]);
            });

            const clientsMap = new Map();
            orders.forEach((o: any) => {
                if (!o.customerPhone) return;
                const key = o.customerPhone;
                if (!clientsMap.has(key)) {
                    clientsMap.set(key, { name: o.customerName, phone: o.customerPhone, ordersCount: 0, totalSpent: 0, lastOrder: o.createdAt });
                }
                const client = clientsMap.get(key);
                client.ordersCount++;
                if (o.priceEstimate && o.status === 'COMPLETED') {
                    client.totalSpent += o.priceEstimate;
                }
                if (new Date(o.createdAt) > new Date(client.lastOrder)) {
                    client.lastOrder = o.createdAt;
                }
            });

            const clientsData = [
                ["Имя", "Телефон", "Кол-во заказов", "Сумма (Выполненные)", "Последний заказ"]
            ];

            Array.from(clientsMap.values()).forEach((c: any) => {
                const dateStr = c.lastOrder ? new Date(c.lastOrder).toLocaleString('ru-RU') : '';
                clientsData.push([
                    c.name, c.phone, c.ordersCount.toString(), c.totalSpent.toString(), dateStr
                ]);
            });

            const wb = xlsx.utils.book_new();

            let hasOrders = false;
            for (const [monthName, data] of Array.from(ordersByMonth.entries())) {
                const ws = xlsx.utils.aoa_to_sheet(data);
                let sheetName = monthName.substring(0, 31);
                xlsx.utils.book_append_sheet(wb, ws, sheetName);
                hasOrders = true;
            }

            if (!hasOrders) {
                const wsOrders = xlsx.utils.aoa_to_sheet([headers]);
                xlsx.utils.book_append_sheet(wb, wsOrders, "Заказы (пусто)");
            }

            const wsDrivers = xlsx.utils.aoa_to_sheet(driversData);
            xlsx.utils.book_append_sheet(wb, wsDrivers, "Водители и Админы");

            const wsClients = xlsx.utils.aoa_to_sheet(clientsData);
            xlsx.utils.book_append_sheet(wb, wsClients, "Клиенты");

            // Add Tickets sheet
            try {
                const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' } });
                const ticketHeaders = ["№", "Тип", "Автор", "Сообщение", "Статус", "Дата"];
                const ticketData = [ticketHeaders];
                tickets.forEach((t: any) => {
                    ticketData.push([
                        t.ticketNum, t.type, t.authorName, t.message,
                        t.status, new Date(t.createdAt).toLocaleString('ru-RU')
                    ]);
                });
                const wsTickets = xlsx.utils.aoa_to_sheet(ticketData);
                xlsx.utils.book_append_sheet(wb, wsTickets, "Обращения");
            } catch (e) { /* Tickets table may not exist */ }

            // Add AuditLog sheet
            try {
                const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
                const logHeaders = ["Действие", "Актор", "Цель", "Детали", "Дата"];
                const logData = [logHeaders];
                logs.forEach((l: any) => {
                    logData.push([
                        l.action, l.actorName, l.targetName || l.targetId || '',
                        l.details || '', new Date(l.createdAt).toLocaleString('ru-RU')
                    ]);
                });
                const wsLogs = xlsx.utils.aoa_to_sheet(logData);
                xlsx.utils.book_append_sheet(wb, wsLogs, "Журнал действий");
            } catch (e) { /* AuditLog table may not exist */ }

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            await ctx.replyWithDocument(
                { source: buffer, filename: `grand_transfer_db_${new Date().toISOString().split('T')[0]}.xlsx` },
                { caption: '📄 Полная выгрузка базы данных (Заказы, Водители, Клиенты, Обращения, Журнал)', protect_content: true }
            );
        } catch (e) {
            console.error("Export Error:", e);
            ctx.reply('❌ Ошибка экспорта EXCEL.', { protect_content: true });
        }
    });
}
