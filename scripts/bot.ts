import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { cities } from '../src/data/cities';
dotenv.config();

const token = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/['"]/g, '').trim();

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing or invalid! Telegram Bot will NOT start, but the website will continue to run.');
    // We don't exit the process here so Next.js can still run
} else {
    // Proceed with initialization if we have *some* token
    // (Actual verification happens when we call bot.launch)
}

const bot = new Telegraf(token || 'dummy:123456'); // Telegraf needs some token format to initialize the class
const prisma = new PrismaClient();
const adminId = (process.env.TELEGRAM_CHAT_ID || '').replace(/['"]/g, '').trim();

// Helper to generate the main menu keyboard
const getMainMenu = (chatId: string, role: string) => {
    const buttons = [
        ['📊 Статистика', '🚗 Мои заказы'],
        ['ℹ️ Справка']
    ];

    // Admin gets extra buttons
    if (role === 'ADMIN' || chatId === adminId) {
        buttons.push(['👀 Активные заявки', '🌐 Панель на сайте']);
        buttons.push(['👥 Пользователи', '📥 Выгрузить EXCEL']);
        buttons.push(['📢 Рассылка', '🗑 Очистить БД']);
    }

    return Markup.keyboard(buttons).resize();
};

bot.start(async (ctx) => {
    const telegramIdStr = ctx.chat.id.toString();
    const telegramIdBigInt = BigInt(ctx.chat.id);

    try {
        let driver = await prisma.driver.findUnique({
            where: { telegramId: telegramIdBigInt }
        });

        const isInitialAdmin = (telegramIdStr === adminId);

        if (!driver) {
            // Auto-approve the admin, others are PENDING
            driver = await prisma.driver.create({
                data: {
                    telegramId: telegramIdBigInt,
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    status: isInitialAdmin ? 'APPROVED' : 'PENDING',
                    role: isInitialAdmin ? 'ADMIN' : 'DRIVER'
                }
            });

            if (isInitialAdmin) {
                return ctx.reply('Добро пожаловать, Главный Администратор! Вы автоматически одобрены.', { ...getMainMenu(telegramIdStr, 'ADMIN'), protect_content: true });
            } else {
                return ctx.reply('Здравствуйте! Ваша заявка в систему GrandTransfer отправлена администратору. Дождитесь одобрения доступа.', { reply_markup: { remove_keyboard: true }, protect_content: true });
            }
        } else if (isInitialAdmin && (driver.status !== 'APPROVED' || driver.role !== 'ADMIN')) {
            // Rescue admin if they logged in before the fix
            driver = await prisma.driver.update({
                where: { telegramId: telegramIdBigInt },
                data: { status: 'APPROVED', role: 'ADMIN' }
            });
            return ctx.reply('Добро пожаловать, Главный Администратор! Ваши права восстановлены.', { ...getMainMenu(telegramIdStr, 'ADMIN'), protect_content: true });
        }

        if (driver.status === 'PENDING') {
            return ctx.reply('Ваша заявка все еще находится на рассмотрении у администратора.', { reply_markup: { remove_keyboard: true }, protect_content: true });
        } else if (driver.status === 'BANNED') {
            return ctx.reply('Доступ в систему заблокирован.', { reply_markup: { remove_keyboard: true }, protect_content: true });
        } else if (driver.status === 'APPROVED') {
            return ctx.reply('Добро пожаловать в рабочую панель водителя GrandTransfer! Ожидайте новых заказов.', { ...getMainMenu(telegramIdStr, driver.role), protect_content: true });
        }
    } catch (e) {
        console.error('Error in /start:', e);
        ctx.reply('Произошла ошибка базы данных.');
    }
});

// Helper to check authorization before executing commands
const checkAuth = async (ctx: any): Promise<{ auth: boolean, role: string, dbId?: string }> => {
    try {
        const id = BigInt(ctx.chat.id);
        const driver = await prisma.driver.findUnique({ where: { telegramId: id } });
        if (!driver || driver.status !== 'APPROVED') {
            ctx.reply('У вас нет доступа (либо вы заблокированы/в ожидании).');
            return { auth: false, role: 'USER' };
        }
        return { auth: true, role: driver.role, dbId: driver.id };
    } catch (e) {
        return { auth: false, role: 'USER' };
    }
};

bot.hears('📊 Статистика', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
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
        await ctx.replyWithHTML(msg, getMainMenu(ctx.chat.id.toString(), role));
    } catch (e) {
        ctx.reply('❌ Ошибка при получении статистики.', { protect_content: true });
    }
});

bot.hears('ℹ️ Справка', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth) return;

    let msg = `🤖 <b>Справка по боту GrandTransfer</b>\n\n`;
    msg += `<b>Основные функции (для водителей):</b>\n`;
    msg += `• <b>Получение рассылок:</b> Бот будет присылать уведомления о новых заказах с сайта с полной информацией. Нажмите «✅ Забрать заявку», чтобы взять её (кнопка пропадет у остальных).\n`;
    msg += `• <b>🚗 Мои заказы:</b> Просмотр списка своих активных взятых заявок с контактами клиента и ссылкой на маршрут в Яндекс Картах.\n`;
    msg += `• <b>📊 Статистика:</b> Просмотр общей выручки сервиса и количества заказов.\n\n`;

    if (role === 'ADMIN') {
        msg += `👑 <b>Дополнительные функции (Администратор):</b>\n`;
        msg += `• <b>👀 Активные заявки:</b> Просмотр подробностей *всех* взятых в работу заявок с указанием исполнителя.\n`;
        msg += `• <b>👥 Пользователи:</b> Панель управления. Позволяет одобрять новые заявки водителей, банить, выдавать права администратора, а также просматривать список заказов каждого пользователя.\n`;
        msg += `• <b>📢 Рассылка:</b> Команда <code>/send текст</code> позволяет отправить важное сообщение всем водителям.\n`;
        msg += `• <b>📥 Выгрузить EXCEL:</b> Скачивание всей базы заказов в виде CSV файла.\n`;
        msg += `• <b>🗑 Очистить БД:</b> Удаление всех заявок из базы данных.\n`;
        msg += `• <b>🌐 Панель на сайте:</b> Получение ссылки и пин-кода для доступа к веб-интерфейсу.\n`;
    }

    ctx.replyWithHTML(msg, { protect_content: true });
});

bot.hears('🚗 Мои заказы', async (ctx) => {
    const { auth, dbId } = await checkAuth(ctx);
    if (!auth || !dbId) return;

    try {
        const myOrders = await prisma.order.findMany({
            where: { driverId: dbId, status: 'TAKEN' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        if (myOrders.length === 0) {
            return ctx.reply('У вас пока нет активных взятых заявок.', { protect_content: true });
        }

        let msg = '🚗 <b>Ваши активные заявки:</b>\n\n';
        myOrders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';

            const fromCityObj = cities.find(c => c.name.toLowerCase() === o.fromCity.toLowerCase());
            const toCityObj = cities.find(c => c.name.toLowerCase() === o.toCity.toLowerCase());

            const pt1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(o.fromCity);
            const pt2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(o.toCity);
            const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

            msg += `📋 <b>Заявка № ${o.id}</b> (создана ${dateStr})\n` +
                `📍 <b>Откуда:</b> ${o.fromCity}\n` +
                `🏁 <b>Куда:</b> ${o.toCity}\n` +
                `🚕 <b>Тариф:</b> ${o.tariff}\n` +
                `👥 <b>Пассажиров:</b> ${o.passengers}\n` +
                `💰 <b>Стоимость:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n\n` +
                `📝 <b>Комментарий:</b> ${o.comments || 'Нет'}\n` +
                `🗺 <a href="${mapLink}">📍 Открыть маршрут в Яндекс Картах</a>\n\n` +
                `👤 <b>Клиент:</b> ${o.customerName}\n` +
                `📞 <b>Телефон:</b> ${o.customerPhone}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n`;
        });


        ctx.replyWithHTML(msg, { protect_content: true });
    } catch (err) {
        ctx.reply('❌ Ошибка при получении ваших заказов.', { protect_content: true });
    }
});

bot.hears('👀 Активные заявки', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    try {
        const activeOrders = await prisma.order.findMany({
            where: { status: 'TAKEN' },
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
        activeOrders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            const driverName = o.driverId ? driverMap.get(o.driverId) || 'Неизвестен' : 'Неизвестен';

            msg += `📋 <b>Заявка № ${o.id}</b> (${dateStr})\n` +
                `📍 <b>Маршрут:</b> ${o.fromCity} — ${o.toCity}\n` +
                `💰 <b>Сумма:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n` +
                `👨‍✈️ <b>Исполнитель:</b> ${driverName}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n`;
        });

        ctx.replyWithHTML(msg, { protect_content: true });
    } catch (err) {
        ctx.reply('❌ Ошибка при получении активных заявок.', { protect_content: true });
    }
});

// Admin commands
bot.hears('🌐 Панель на сайте', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    ctx.reply('Панель управления доступна по ссылке: https://межгород.com/admin/drivers\n\nPIN-код: 7878', { protect_content: true });
});

bot.hears('🗑 Очистить БД', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    try {
        await prisma.order.deleteMany({});
        ctx.reply('🗑 Статистика (все заявки) была успешно удалена из базы данных.', { protect_content: true });
    } catch (e) {
        ctx.reply('❌ Ошибка удаления данных.', { protect_content: true });
    }
});

bot.hears('📢 Рассылка', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    ctx.reply('Для того чтобы отправить сообщение ВСЕМ пользователям бота (включая водителей), напишите команду <b>/send</b> и ваш текст через пробел.\n\nНапример:\n<code>/send Вышло обновление! Чтобы появились новые функции, напишите /start</code>', { parse_mode: 'HTML', protect_content: true });
});

bot.command('send', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    const text = ctx.message.text.replace('/send', '').trim();
    if (!text) {
        return ctx.reply('⚠️ Пожалуйста, напишите текст после команды /send.\nПример: /send Всем привет!', { protect_content: true });
    }

    try {
        const users = await prisma.driver.findMany();
        let successCount = 0;

        await ctx.reply(`⏳ Начинаю рассылку для ${users.length} пользователей...`);

        for (const u of users) {
            try {
                await bot.telegram.sendMessage(
                    Number(u.telegramId),
                    `📢 <b>Уведомление от администрации:</b>\n\n${text}`,
                    { parse_mode: 'HTML', protect_content: true }
                );
                successCount++;
            } catch (e) {
                // user might have blocked the bot, skip
            }
        }

        ctx.reply(`✅ Рассылка завершена!\nУспешно доставлено: ${successCount} из ${users.length} пользователей.`, { protect_content: true });
    } catch (e) {
        ctx.reply('❌ Ошибка при рассылке.', { protect_content: true });
    }
});

bot.hears('📥 Выгрузить EXCEL', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    try {
        const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
        let csv = '\uFEFF';
        csv += "ID;Дата;Откуда;Куда;Тариф;Пассажиров;Сумма;Имя;Телефон;Комментарий;Водитель\n";
        orders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            const safeComment = (o.comments || '').replace(/;/g, ',').replace(/\n/g, ' ');
            csv += `${o.id};${dateStr};${o.fromCity};${o.toCity};${o.tariff};${o.passengers};${o.priceEstimate || ''};${o.customerName};${o.customerPhone};${safeComment};${o.driverId || ''}\n`;
        });
        const buffer = Buffer.from(csv, 'utf8');
        await ctx.replyWithDocument(
            { source: buffer, filename: `orders_${new Date().toISOString().split('T')[0]}.csv` },
            { caption: '📄 Выгрузка БД', protect_content: true }
        );
    } catch (e) {
        ctx.reply('❌ Ошибка экспорта.', { protect_content: true });
    }
});

// Admin Panel for Users inside Bot
bot.hears('👥 Пользователи', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    try {
        const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
        if (drivers.length === 0) return ctx.reply("В базе нет пользователей.", { protect_content: true });

        // Add a "Search by ID" button at the very top of the user list
        await ctx.reply('🔍 <b>Панель пользователей</b>\nНажмите кнопку ниже, чтобы найти конкретного человека по ID Телеграма или внутреннему ID базы:', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: '🔍 Поиск по ID', callback_data: 'search_user' }]]
            },
            protect_content: true
        });

        for (const d of drivers) {
            const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
            let text = `👤 <b>${name}</b>\nРоль: <b>${d.role}</b>\nСтатус: <b>${d.status}</b>\nTG ID: <code>${d.telegramId}</code>`;

            const buttons = [];
            if (d.status === 'PENDING') {
                buttons.push(Markup.button.callback('✅ Одобрить', `approve_${d.telegramId}`));
            }
            if (d.status !== 'BANNED') {
                buttons.push(Markup.button.callback('🚫 Забанить', `ban_${d.telegramId}`));
            }
            if (d.role !== 'ADMIN') {
                buttons.push(Markup.button.callback('👑 Дать Админа', `makeadmin_${d.telegramId}`));
            }
            if (d.status === 'BANNED') {
                buttons.push(Markup.button.callback('🔄 Восстановить', `approve_${d.telegramId}`));
            }
            buttons.push(Markup.button.callback('📦 Заказы', `view_orders_${d.telegramId}`));

            const keyboardRows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                keyboardRows.push(buttons.slice(i, i + 2));
            }

            await ctx.replyWithHTML(text, { ...Markup.inlineKeyboard(keyboardRows), protect_content: true });
        }
    } catch (err) {
        ctx.reply('❌ Ошибка получения пользователей.', { protect_content: true });
    }
});

// Admin Panel Callbacks
bot.action('search_user', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    await ctx.reply('Введите Telegram ID пользователя для поиска (только цифры):', {
        reply_markup: { force_reply: true },
        protect_content: true
    });
    await ctx.answerCbQuery();
});

// Listen for the text reply containing the ID
bot.on('text', async (ctx, next) => {
    const replyToMsg = ctx.message.reply_to_message as any;
    if (replyToMsg && replyToMsg.text && replyToMsg.text.includes('Введите Telegram ID пользователя')) {
        const { auth, role } = await checkAuth(ctx);
        if (!auth || role !== 'ADMIN') return;

        const searchIdStr = ctx.message.text.trim();
        if (!/^\d+$/.test(searchIdStr)) {
            return ctx.reply('Ошибка: необходимо ввести только числовой ID.', { protect_content: true });
        }

        try {
            const searchId = BigInt(searchIdStr);
            const d = await prisma.driver.findUnique({ where: { telegramId: searchId } });

            if (!d) {
                return ctx.reply('Пользователь с таким ID не найден.', { protect_content: true });
            }

            const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
            let text = `🔍 <b>Найден Пользователь</b>\n\n👤 <b>${name}</b>\nРоль: <b>${d.role}</b>\nСтатус: <b>${d.status}</b>\nTG ID: <code>${d.telegramId}</code>`;

            const buttons = [];
            if (d.status === 'PENDING') {
                buttons.push(Markup.button.callback('✅ Одобрить', `approve_${d.telegramId}`));
            }
            if (d.status !== 'BANNED') {
                buttons.push(Markup.button.callback('🚫 Забанить', `ban_${d.telegramId}`));
            }
            if (d.role !== 'ADMIN') {
                buttons.push(Markup.button.callback('👑 Дать Админа', `makeadmin_${d.telegramId}`));
            }
            if (d.status === 'BANNED') {
                buttons.push(Markup.button.callback('🔄 Восстановить', `approve_${d.telegramId}`));
            }
            buttons.push(Markup.button.callback('📦 Заказы', `view_orders_${d.telegramId}`));

            const keyboardRows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                keyboardRows.push(buttons.slice(i, i + 2));
            }

            return ctx.replyWithHTML(text, { ...Markup.inlineKeyboard(keyboardRows), protect_content: true });
        } catch (err) {
            return ctx.reply('❌ Произошла ошибка при поиске.', { protect_content: true });
        }
    }
    return next();
});

bot.action(/^approve_(\d+)$/, async (ctx) => {
    const telegramId = BigInt(ctx.match[1]);
    try {
        const updatedDriver = await prisma.driver.update({ where: { telegramId }, data: { status: 'APPROVED' } });
        await ctx.answerCbQuery('Пользователь одобрен');
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n✅ СТАТУС ИЗМЕНЕН НА: APPROVED');
        try {
            await bot.telegram.sendMessage(Number(telegramId), '✅ Ваша заявка одобрена! Теперь вам доступно меню водителя.', { ...getMainMenu(telegramId.toString(), updatedDriver.role), protect_content: true });
        } catch (e) { }
    } catch {
        await ctx.answerCbQuery('Ошибка обновления');
    }
});
bot.action(/^ban_(\d+)$/, async (ctx) => {
    const telegramId = BigInt(ctx.match[1]);
    try {
        await prisma.driver.update({ where: { telegramId }, data: { status: 'BANNED' } });
        await ctx.answerCbQuery('Пользователь забанен');
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n🚫 СТАТУС ИЗМЕНЕН НА: BANNED');
    } catch {
        await ctx.answerCbQuery('Ошибка обновления');
    }
});
bot.action(/^makeadmin_(\d+)$/, async (ctx) => {
    const telegramId = BigInt(ctx.match[1]);
    try {
        await prisma.driver.update({ where: { telegramId }, data: { role: 'ADMIN' } });
        await ctx.answerCbQuery('Права администратора выданы');
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n👑 РОЛЬ ИЗМЕНЕНА НА: ADMIN');
        try {
            await bot.telegram.sendMessage(Number(telegramId), '👑 Вам выданы права администратора! Полноценное меню обновлено.', { ...getMainMenu(telegramId.toString(), 'ADMIN'), protect_content: true });
        } catch (e) { }
    } catch {
        await ctx.answerCbQuery('Ошибка обновления');
    }
});

bot.action(/^view_orders_(\d+)$/, async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') {
        return ctx.answerCbQuery('Нет прав доступа', { show_alert: true });
    }

    const telegramId = BigInt(ctx.match[1]);
    try {
        const targetDriver = await prisma.driver.findUnique({ where: { telegramId } });
        if (!targetDriver) return ctx.answerCbQuery('Водитель не найден.');

        const orders = await prisma.order.findMany({
            where: { driverId: targetDriver.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        if (orders.length === 0) {
            return ctx.answerCbQuery('У пользователя нет взятых заявок.', { show_alert: true });
        }

        let msg = `📦 <b>Заявки водителя ${targetDriver.firstName || 'Без имени'}:</b>\n\n`;
        orders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            msg += `📋 <b>Заявка № ${o.id}</b> (создана ${dateStr})\n` +
                `📍 <b>Откуда:</b> ${o.fromCity}\n` +
                `🏁 <b>Куда:</b> ${o.toCity}\n` +
                `🚕 <b>Тариф:</b> ${o.tariff}\n` +
                `👥 <b>Пассажиров:</b> ${o.passengers}\n` +
                `💰 <b>Стоимость:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n\n` +
                `📝 <b>Комментарий:</b> ${o.comments || 'Нет'}\n` +
                `👤 <b>Клиент:</b> ${o.customerName}\n` +
                `📞 <b>Телефон:</b> ${o.customerPhone}\n` +
                `👨‍✈️ <b>Исполнитель:</b> ${targetDriver.firstName || 'Без имени'} (@${targetDriver.username || 'Нет'})\n` +
                `📌 <b>Статус:</b> ${o.status}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n`;
        });

        await ctx.answerCbQuery('Загружаем заявки...');
        await ctx.replyWithHTML(msg, { protect_content: true });
    } catch (err) {
        ctx.answerCbQuery('Ошибка получения заявок.');
    }
});

// Take Order Action
bot.action(/^take_order_(\d+)$/, async (ctx) => {
    const { auth, dbId } = await checkAuth(ctx);
    if (!auth || !dbId) {
        return ctx.answerCbQuery('У вас нет прав для взятия заявки.', { show_alert: true });
    }

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
        }

        if (order.status !== 'NEW') {
            // Order is already taken or completed
            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            await ctx.editMessageText(txt + '\n\n❌ <i>Заявка уже взята в работу другим водителем.</i>', { parse_mode: 'HTML' });
            return ctx.answerCbQuery('Заявка уже взята!', { show_alert: true });
        }

        // Lock the order
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'TAKEN', driverId: dbId }
        });

        const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";

        const customerInfo = `\n\n✅ <b>ВЫ ВЗЯЛИ ЭТУ ЗАЯВКУ В РАБОТУ</b>\n\n👤 <b>Клиент:</b> ${order.customerName}\n📞 <b>Телефон:</b> ${order.customerPhone}`;

        await ctx.editMessageText(txt + customerInfo, { parse_mode: 'HTML' });
        await ctx.answerCbQuery('Вы успешно взяли заявку!', { show_alert: true });

        // Retrieve and delete messages for other drivers
        try {
            const bms = await (prisma as any).broadcastMessage.findMany({ where: { orderId } });
            const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

            for (const bm of bms) {
                // Do not delete for the driver who took the order
                if (ctx.chat && bm.telegramId === BigInt(ctx.chat.id)) continue;

                // Handle ADMINs vs regular drivers
                const bmDriver = await prisma.driver.findUnique({ where: { telegramId: bm.telegramId } });
                const isAdmin = (bmDriver?.role === 'ADMIN' || bm.telegramId.toString() === adminId);

                if (isAdmin) {
                    // For admins, edit the message to explicitly say who took it, removing the button
                    try {
                        const originalMsg = await prisma.order.findUnique({ where: { id: orderId } });
                        const adminTxt = `🚨 <b>Заявка № ${orderId} ВЗЯТА</b>\n\n👤 Исполнитель: <b>${takerName}</b>\n📍 Маршрут: ${originalMsg?.fromCity || 'Неизвестно'} — ${originalMsg?.toCity || 'Неизвестно'}\n💰 ${originalMsg?.priceEstimate ? originalMsg.priceEstimate + ' ₽' : 'Без оценки'}`;
                        await bot.telegram.editMessageText(Number(bm.telegramId), bm.messageId, undefined, adminTxt, { parse_mode: 'HTML' });
                    } catch (editErr) {
                        console.error('Failed to edit admin msg', editErr);
                    }
                } else {
                    // Delete message for other regular drivers completely
                    try {
                        await bot.telegram.deleteMessage(Number(bm.telegramId), bm.messageId);
                    } catch (delErr) {
                        console.error(`Failed to delete message for ${bm.telegramId}:`, delErr);
                    }
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

let isShuttingDown = false;

async function startBot() {
    while (!isShuttingDown) {
        try {
            console.log('🤖 Telegram bot is starting...');
            // Force delete any existing webhook so long-polling works reliably
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            await bot.launch({ dropPendingUpdates: true });
            console.log('🤖 Telegram bot stopped normally.');
            break;
        } catch (error) {
            console.error('Bot crashed, restarting in 5s...', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startBot();

process.once('SIGINT', () => { isShuttingDown = true; bot.stop('SIGINT'); });
process.once('SIGTERM', () => { isShuttingDown = true; bot.stop('SIGTERM'); });
