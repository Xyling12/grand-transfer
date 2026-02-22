import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Telegraf(token) : null;
const chatId = process.env.TELEGRAM_CHAT_ID;

const prisma = new PrismaClient();

import { cities } from '@/data/cities';

export async function sendOrderNotification(orderData: Record<string, string | number | null | undefined>) {
    if (!bot || !chatId) {
        console.warn('Telegram bot is not configured properly (missing token or chat ID)');
        return;
    }

    // Try to resolve city coordinates
    const fromCityObj = cities.find(c => c.name.toLowerCase() === String(orderData.fromCity || '').trim().toLowerCase());
    const toCityObj = cities.find(c => c.name.toLowerCase() === String(orderData.toCity || '').trim().toLowerCase());

    let fromRtext = orderData.fromCity ? encodeURIComponent(String(orderData.fromCity)) : '';
    let toRtext = orderData.toCity ? encodeURIComponent(String(orderData.toCity)) : '';

    // If coordinates are found, use them (lat,lon format) for precise mobile routing
    if (fromCityObj) fromRtext = `${fromCityObj.lat},${fromCityObj.lon}`;
    if (toCityObj) toRtext = `${toCityObj.lat},${toCityObj.lon}`;

    // Use the exact format from the user's successful manual test.
    // Format: https://2gis.ru/izhevsk/directions/points/{lonFrom}%2C{latFrom}%3B{lonTo}%2C{latTo}
    // We can omit the specific city slug (like /izhevsk/) and 2GIS will auto-detect bounds
    const directLink = `https://2gis.ru/directions/points/${fromCityObj?.lon || ''}%2C${fromCityObj?.lat || ''}%3B${toCityObj?.lon || ''}%2C${toCityObj?.lat || ''}`;

    // Fallback for custom string inputs (no coordinates)
    const textFrom = orderData.fromCity ? encodeURIComponent(String(orderData.fromCity).trim()) : '';
    const textTo = orderData.toCity ? encodeURIComponent(String(orderData.toCity).trim()) : '';
    const fallbackLink = `https://2gis.ru/routing?waypoint1=${textFrom}&waypoint2=${textTo}&type=car`;

    const message = `
🚨 <b>Новая заявка на трансфер!</b>

👤 <b>Клиент:</b> ${orderData.customerName}
📞 <b>Телефон:</b> ${orderData.customerPhone}

📍 <b>Откуда:</b> ${orderData.fromCity}
🏁 <b>Куда:</b> ${orderData.toCity}
🗺️ <b>Открыть маршрут:</b> <a href="${fromCityObj && toCityObj ? directLink : fallbackLink}">В 2GIS (Онлайн / Приложение) 🗺️</a>
🚕 <b>Тариф:</b> ${orderData.tariff}
👥 <b>Пассажиров:</b> ${orderData.passengers}
💰 <b>Расчетная стоимость:</b> ${orderData.priceEstimate ? orderData.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${orderData.comments || 'Нет'}
📅 <b>Дата/Время:</b> ${orderData.dateTime || 'Сразу'}

<i>№ заказа: ${orderData.id}</i>
`;

    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (e) {
        console.error('Failed to send Telegram message:', e);
    }
}

// Optional: Statistics fetcher to be used inside a polling script later
export async function getStatsMessage() {
    const totalOrders = await prisma.order.count();

    // Using a simpler estimation since actual sum needs Prisma aggregate grouped by or raw query
    const sumResult = await prisma.order.aggregate({
        _sum: {
            priceEstimate: true,
        },
    });

    const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    let recentRevenue = 0;
    recentOrders.forEach(o => recentRevenue += (o.priceEstimate || 0));

    return `
📊 <b>Статистика GrandTransfer</b>
────────────────
<b>За всё время:</b>
✅ Заявок оформлено: ${totalOrders}
💰 Выручка (оценочно): ~${sumResult._sum.priceEstimate || 0} ₽
────────────────
<b>Последние 10 заявок:</b>
🚗 Выручка: ~${recentRevenue} ₽
    `.trim();
}
