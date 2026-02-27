import { Markup } from 'telegraf';
import { BotDeps } from './types';
import { checkAuth, formatOrderMessage, translateTariff, translateStatus, getMainMenu, getProtectContent } from './helpers';
import { cities } from '../../src/data/cities';
import * as xlsx from 'xlsx';

export function registerOrderHandlers(deps: BotDeps) {
    const { bot, prisma, adminId } = deps;

    // --- Verify Approve/Reject Handlers (Inline Buttons from Registration) ---
    bot.action(/^verify_approve_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

        const driverTgId = BigInt(ctx.match[1]);
        try {
            const driver = await prisma.driver.update({
                where: { telegramId: driverTgId },
                data: { status: 'APPROVED' }
            });

            await ctx.answerCbQuery('Водитель одобрен!');
            await ctx.editMessageText(
                `✅ <b>Заявка одобрена!</b>\nВодитель: ${driver.fullFio || driver.firstName}\nТелефон: ${driver.phone}\nTelegram ID: ${driverTgId.toString()}`,
                { parse_mode: 'HTML' }
            );

            await bot.telegram.sendMessage(
                Number(driverTgId),
                '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nТеперь вам доступно рабочее меню водителя.',
                { parse_mode: 'HTML', ...getMainMenu(driverTgId.toString(), driver.role, adminId) }
            ).catch(() => { });
        } catch (e) {
            console.error(e);
            ctx.answerCbQuery('Ошибка. Возможно, пользователь уже удален.', { show_alert: true });
        }
    });

    bot.action(/^verify_approve_disp_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

        const driverTgId = BigInt(ctx.match[1]);
        try {
            const driver = await prisma.driver.update({
                where: { telegramId: driverTgId },
                data: { status: 'APPROVED', role: 'DISPATCHER' }
            });

            await ctx.answerCbQuery('Диспетчер одобрен!');
            await ctx.editMessageText(
                `✅ <b>Заявка одобрена (Диспетчер)!</b>\nДиспетчер: ${driver.fullFio || driver.firstName}\nТелефон: ${driver.phone}\nTelegram ID: ${driverTgId.toString()}`,
                { parse_mode: 'HTML' }
            );

            await bot.telegram.sendMessage(
                Number(driverTgId),
                '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nТеперь вам доступно рабочее меню диспетчера.',
                { parse_mode: 'HTML', ...getMainMenu(driverTgId.toString(), driver.role, adminId) }
            ).catch(() => { });
        } catch (e) {
            console.error(e);
            ctx.answerCbQuery('Ошибка. Возможно, пользователь уже удален.', { show_alert: true });
        }
    });

    bot.action(/^verify_reject_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

        const driverTgId = BigInt(ctx.match[1]);
        try {
            const driver = await prisma.driver.update({
                where: { telegramId: driverTgId },
                data: { status: 'BANNED' }
            });

            await ctx.answerCbQuery('Заявка отклонена');
            await ctx.editMessageText(
                `❌ <b>Заявка отклонена!</b>\nВодитель: ${driver.fullFio || driver.firstName}\nТелефон: ${driver.phone}\nTelegram ID: ${driverTgId.toString()}`,
                { parse_mode: 'HTML' }
            );

            await bot.telegram.sendMessage(
                Number(driverTgId),
                '❌ <b>Ваша заявка на регистрацию отклонена администратором.</b>\nДоступ к системе закрыт.',
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            ).catch(() => { });
        } catch (e) {
            console.error(e);
            ctx.answerCbQuery('Ошибка. Возможно, пользователь уже удален.', { show_alert: true });
        }
    });

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

                const buttons = [];
                if (o.status === 'TAKEN' && o.driverId === dbId) {
                    buttons.push([{ text: '✅ Заявка выполнена', callback_data: `complete_order_${o.id}` }]);
                }

                await ctx.replyWithHTML(msg, {
                    protect_content: protectContentGlobal,
                    reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined
                });
            }
        } catch (err) {
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

            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : '';
            const pt1 = encodeURIComponent(order.fromCity);
            const pt2 = encodeURIComponent(order.toCity);
            const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

            const msg = `
📋 <b>ПОЛНАЯ ЗАЯВКА № ${order.id}</b>
<i>(Создана ${dateStr})</i>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.customerPhone}
📌 <b>Текущий Статус:</b> ${translateStatus(order.status, role)}
            `.trim();

            const keyboardButtons: any[] = [];
            if (order.status === 'NEW' || order.status === 'PROCESSING') {
                keyboardButtons.push([{ text: '🎧 Взять в работу', callback_data: `take_work_${order.id}` }]);
                keyboardButtons.push([{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${order.id}` }]);
            } else if (order.status === 'TAKEN' || order.status === 'PROCESSING') {
                keyboardButtons.push([{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }]);
            }
            keyboardButtons.push([{ text: '🗺 Открыть маршрут', url: mapLink }]);

            const protectContentGlobal = await getProtectContent(deps, role!);

            await ctx.replyWithHTML(msg, {
                reply_markup: { inline_keyboard: keyboardButtons },
                protect_content: protectContentGlobal
            });
            await ctx.answerCbQuery();
        } catch (err) {
            ctx.answerCbQuery('Ошибка получения заявки');
        }
    });

    // --- New Orders (without dispatcher) ---
    bot.hears('🆕 Заказы без работы', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'DISPATCHER' && role !== 'ADMIN')) return;

        try {
            const newOrders = await prisma.order.findMany({
                where: { status: 'NEW' },
                include: { customer: true, dispatcher: true, driver: true },
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

            const fromCityObj = cities.find((c: any) => c.name.toLowerCase() === order.fromCity.toLowerCase());
            const toCityObj = cities.find((c: any) => c.name.toLowerCase() === order.toCity.toLowerCase());
            const pt1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(order.fromCity);
            const pt2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(order.toCity);
            const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

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
                    [{ text: '🗺 Открыть маршрут', url: mapLink }]
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

                        const fromCityObj = cities.find((c: any) => c.name.toLowerCase() === order.fromCity.toLowerCase());
                        const toCityObj = cities.find((c: any) => c.name.toLowerCase() === order.toCity.toLowerCase());
                        const pt1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(order.fromCity);
                        const pt2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(order.toCity);
                        const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

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
                                    [{ text: '🗺 Открыть Яндекс Карты', url: mapLink }]
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

            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            const customerInfo = `\n\n✅ <b>ВЫ ВЗЯЛИ ЭТУ ЗАЯВКУ В РАБОТУ</b>\n\n👤 <b>Клиент:</b> ${order.customerName}\n📞 <b>Телефон:</b> ${order.customerPhone}\n\n<i>Для завершения заказа нажмите кнопку ниже:</i>`;

            await ctx.editMessageText(txt + customerInfo, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }]
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
                    const dispMsg = `✅ <b>Заявка № ${order.id} ВЫПОЛНЕНА</b>\n\nИсполнитель: <b>${takerName}</b>\nМаршрут: ${order.fromCity} — ${order.toCity}`;
                    await bot.telegram.sendMessage(Number(disp.telegramId), dispMsg, { parse_mode: 'HTML' }).catch(() => { });
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

    // --- Statistics ---
    bot.hears('📊 Статистика', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || (role !== 'ADMIN' && role !== 'DRIVER')) return;

        try {
            const totalOrders = await prisma.order.count();
            const sumResult = await prisma.order.aggregate({ _sum: { priceEstimate: true } });

            const tariffGroups = await prisma.order.groupBy({
                by: ['tariff'],
                _count: { tariff: true },
                orderBy: { _count: { tariff: 'desc' } }
            });

            let tariffStatsStr = "";
            if (tariffGroups.length > 0) {
                tariffStatsStr = "<b>Заказов по тарифам:</b>\n" + tariffGroups.map((t: any) => {
                    const capitalizedName = t.tariff ? t.tariff.charAt(0).toUpperCase() + t.tariff.slice(1) : 'Не указан';
                    return `- ${capitalizedName}: ${t._count.tariff} шт.`;
                }).join('\n') + "\n────────────────";
            }

            const msg = `
📊 <b>Статистика сервиса</b>
────────────────
✅ Всего заявок оформлено: ${totalOrders}
💰 Выручка (оценочно): ~${sumResult._sum.priceEstimate || 0} ₽
────────────────
${tariffStatsStr}`.trim();
            await ctx.replyWithHTML(msg, getMainMenu(ctx.chat.id.toString(), role!, adminId));
        } catch (e) {
            ctx.reply('❌ Ошибка при получении статистики.', { protect_content: role !== 'ADMIN' });
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
            const headers = ["ID", "Дата", "Откуда", "Куда", "Тариф", "Пассажиров", "Сумма", "Имя Клиента", "Телефон", "Комментарий", "Исполнитель", "Статус"];

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
                    o.customerName, o.customerPhone, o.comments || '', driverStr, translateStatus(o.status)
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

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            await ctx.replyWithDocument(
                { source: buffer, filename: `grand_transfer_db_${new Date().toISOString().split('T')[0]}.xlsx` },
                { caption: '📄 Полная выгрузка базы данных (Заказы, Водители, Клиенты)', protect_content: true }
            );
        } catch (e) {
            console.error("Export Error:", e);
            ctx.reply('❌ Ошибка экспорта EXCEL.', { protect_content: true });
        }
    });
}
