import { Markup } from 'telegraf';
import { BotDeps } from './types';
import { cities } from '../../src/data/cities';

// --- Translation Helpers (shared with CRM) ---
import { translateTariff, translateStatus } from '../../src/lib/translations';
export { translateTariff, translateStatus };

// --- Date Format Helper ---
// Converts "YYYY-MM-DD HH:MM" or "YYYY-MM-DD" to "DD/MM/YYYY HH:MM" or "DD/MM/YYYY"
export const formatScheduledDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || dateStr.trim() === '') return 'Сразу';
    const trimmed = dateStr.trim();
    // Match YYYY-MM-DD with optional time
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
    if (match) {
        const [, year, month, day, rest] = match;
        return `${day}/${month}/${year}${rest}`;
    }
    return trimmed;
};


export const formatOrderMessage = (o: any, role: string) => {
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const takenStr = o.takenAt ? new Date(o.takenAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const compStr = o.completedAt ? new Date(o.completedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const mapLink = getMapWebLink(o.fromCity, o.toCity);

    let dispStr = '';
    if (o.dispatcher) {
        dispStr = `🎧 <b>Диспетчер:</b> <a href="tg://user?id=${o.dispatcher.telegramId.toString()}">${o.dispatcher.firstName || o.dispatcher.username || 'Профиль'}</a>\n`;
    }
    let driverStr = '';
    if (o.driver) {
        driverStr = `🚕 <b>Водитель:</b> <a href="tg://user?id=${o.driver.telegramId.toString()}">${o.driver.firstName || o.driver.username || 'Профиль'}</a>\n`;
    }

    let timeStr = '';
    if (takenStr) {
        timeStr += `⏱ <b>Взята:</b> ${takenStr}\n`;
    }
    if (compStr) {
        timeStr += `⏱ <b>Завершена:</b> ${compStr}\n`;
    }

    return `📋 <b>Заявка № ${o.id}</b> (создана ${dateStr})\n` +
        `⏳ <b>Статус:</b> ${translateStatus(o.status, role)}\n` +
        `📍 <b>Откуда:</b> ${o.fromCity}\n` +
        `🏁 <b>Куда:</b> ${o.toCity}\n` +
        `🚕 <b>Тариф:</b> ${translateTariff(o.tariff)}\n` +
        `👥 <b>Пассажиров:</b> ${o.passengers}\n` +
        `💰 <b>Стоимость:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n\n` +
        `📝 <b>Комментарий:</b> ${o.comments || 'Нет'}\n` +
        `🗺 <a href="${mapLink}">📍 Открыть маршрут в Яндекс Картах</a>\n\n` +
        `👤 <b>Клиент:</b> ${o.customerName}\n` +
        `📞 <b>Телефон:</b> ${o.customerPhone}\n\n` +
        dispStr + driverStr + timeStr;
};

// --- Menu Helper ---

export const getMainMenu = (chatId: string, role: string, adminId: string) => {
    let buttons = [];

    if (role === 'ADMIN' || chatId === adminId) {
        buttons.push(['🆕 Заказы без работы', '👀 Активные заявки']);
        buttons.push(['👥 Пользователи', '📋 Ожидающие регистрацию']);
        buttons.push(['📢 Рассылка', '📊 Статистика']);
        buttons.push(['📥 Выгрузить EXCEL', '💻 CRM Система']);
        buttons.push(['🚗 Мои заявки', '📚 История заявок']);
        buttons.push(['✅ Выполненные заявки', '⚙️ Настройки']);
        buttons.push(['🗑 Очистить БД', '💬 Чат']);
        buttons.push(['🐛 Баг-репорты', '📩 Тикеты в работе']);
        buttons.push(['🛠 Найдена ошибка', 'ℹ️ Справка']);
    } else if (role === 'DISPATCHER') {
        buttons.push(['🆕 Заказы без работы', '👀 Активные заявки']);
        buttons.push(['🚗 Мои заявки', '📚 История заявок']);
        buttons.push(['💬 Чат']);
        buttons.push(['📩 Мои обращения', '🆘 Написать в поддержку']);
        buttons.push(['🛠 Найдена ошибка', 'ℹ️ Справка']);
    } else {
        buttons.push(['🚗 Мои заказы', '📚 История заявок']);
        buttons.push(['📋 Доступные заявки', '💬 Чат']);
        buttons.push(['📩 Мои обращения', '🆘 Написать в поддержку']);
        buttons.push(['🛠 Найдена ошибка', 'ℹ️ Справка']);
    }

    return Markup.keyboard(buttons).resize();
};

// --- Map Link Helpers ---
function getCityPoint(cityName: string): string {
    const found = cities.find(c => c.name.toLowerCase() === cityName.trim().toLowerCase());
    return found ? `${found.lat},${found.lon}` : encodeURIComponent(cityName);
}

export const getMapDeepLink = (fromCity: string, toCity: string) => {
    const pt1 = getCityPoint(fromCity);
    const pt2 = getCityPoint(toCity);
    return `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;
};

export const getMapWebLink = (fromCity: string, toCity: string) => {
    const pt1 = getCityPoint(fromCity);
    const pt2 = getCityPoint(toCity);
    return `https://yandex.ru/maps/?rtext=${pt1}~${pt2}&rtt=auto`;
};

// --- Reply With Menu Helper ---
// Always re-sends the main menu keyboard to avoid losing it
export const replyWithMenu = async (ctx: any, deps: BotDeps, text: string, extra?: any) => {
    const tgIdStr = ctx.chat?.id?.toString() || '';
    try {
        const driver = await deps.prisma.driver.findUnique({ where: { telegramId: BigInt(tgIdStr) } });
        const role = driver?.role || 'USER';
        const menu = getMainMenu(tgIdStr, role, deps.adminId);
        return ctx.reply(text, { ...menu, ...extra });
    } catch (e) {
        return ctx.reply(text, extra);
    }
};

// --- Auth Helper ---

export const checkAuth = async (ctx: any, deps: BotDeps): Promise<{ auth: boolean, role: string, dbId?: string }> => {
    try {
        const id = BigInt(ctx.chat.id);
        const driver = await deps.prisma.driver.findUnique({ where: { telegramId: id } });
        if (!driver || driver.status !== 'APPROVED') {
            ctx.reply('У вас нет доступа (либо вы заблокированы/в ожидании).');
            return { auth: false, role: 'USER' };
        }
        return { auth: true, role: driver.role, dbId: driver.id };
    } catch (e) {
        return { auth: false, role: 'USER' };
    }
};

// --- Find Driver Helper ---

export const findDriverByArg = async (arg: string, deps: BotDeps) => {
    const cleanArg = arg.replace(/[^\d+]/g, '');
    let driver = null;

    if (/^\d+$/.test(cleanArg)) {
        try {
            driver = await deps.prisma.driver.findUnique({ where: { telegramId: BigInt(cleanArg) } });
        } catch (e) { }
    }

    if (!driver && cleanArg) {
        const possibleDrivers = await deps.prisma.driver.findMany({
            where: { phone: { contains: cleanArg } }
        });
        if (possibleDrivers.length === 1) {
            driver = possibleDrivers[0];
        } else if (possibleDrivers.length > 1) {
            throw new Error(`Найдено несколько водителей с похожеми номерами (${cleanArg}). Пожалуйста, используйте Telegram ID.`);
        }
    }
    return driver;
};

// --- Protect Content Helper ---
export const getProtectContent = async (deps: BotDeps, role: string): Promise<boolean> => {
    if (role === 'ADMIN') return false;
    try {
        const settings = await deps.prisma.botSettings.findUnique({ where: { id: 1 } });
        return settings?.protectContent ?? true;
    } catch (e) {
        console.warn("Could not query BotSettings", e);
        return true;
    }
};
