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

    const message = `
🚨 <b>Новая заявка на трансфер!</b>

👤 <b>Клиент:</b> ${orderData.customerName}
📞 <b>Телефон:</b> ${orderData.customerPhone}

📍 <b>Откуда:</b> ${orderData.fromCity}
🏁 <b>Куда:</b> ${orderData.toCity}
🚕 <b>Тариф:</b> ${orderData.tariff}
👥 <b>Пассажиров:</b> ${orderData.passengers}
💰 <b>Расчетная стоимость:</b> ${orderData.priceEstimate ? orderData.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${orderData.comments || 'Нет'}
📅 <b>Дата/Время:</b> ${orderData.dateTime || 'Сразу'}

<i>№ заказа: ${orderData.id}</i>
`;

    try {
        const approvedDrivers = await prisma.driver.findMany({
            where: { status: 'APPROVED' }
        });

        // Send to all approved drivers
        if (approvedDrivers.length > 0) {
            for (const driver of approvedDrivers) {
                try {
                    await bot.telegram.sendMessage(driver.telegramId.toString(), message, { parse_mode: 'HTML' });
                } catch (err) {
                    console.error(`Failed to send to driver ${driver.telegramId}:`, err);
                }
            }
        } else {
            // Fallback to admin/chat ID if nobody is approved yet
            if (chatId) {
                await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
            }
        }
    } catch (e) {
        console.error('Failed to notify drivers:', e);
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
