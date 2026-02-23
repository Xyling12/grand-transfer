import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { cities } from '@/data/cities';

export async function sendOrderNotification(orderData: Record<string, string | number | null | undefined>) {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/['"]/g, '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').replace(/['"]/g, '').trim();
    const botInstance = token ? new Telegraf(token) : null;

    if (!botInstance || !chatId) {
        console.warn('Telegram bot is not configured properly (missing token or chat ID)');
        return;
    }

    const fromCity = String(orderData.fromCity || '');
    const toCity = String(orderData.toCity || '');
    const checkpointName = orderData.checkpointName ? String(orderData.checkpointName) : '';

    const pt1 = orderData.fromCoords ? String(orderData.fromCoords) : encodeURIComponent(fromCity);
    const pt2 = orderData.toCoords ? String(orderData.toCoords) : encodeURIComponent(toCity);
    const ptCp = orderData.checkpointCoords ? String(orderData.checkpointCoords) : (checkpointName ? encodeURIComponent(checkpointName) : '');

    let rtext = `${pt1}~${pt2}`;
    if (checkpointName || ptCp) {
        rtext = `${pt1}~${ptCp}~${pt2}`;
    }
    const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${rtext}`;

    const message = `
🚨 <b>Новая заявка на трансфер!</b>

📍 <b>Откуда:</b> ${orderData.fromCity}
🏁 <b>Куда:</b> ${orderData.toCity}
${checkpointName ? `🛃 <b>КПП:</b> ${checkpointName}\n` : ''}🚕 <b>Тариф:</b> ${orderData.tariff}
👥 <b>Пассажиров:</b> ${orderData.passengers}
💰 <b>Расчетная стоимость:</b> ${orderData.priceEstimate ? orderData.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${orderData.comments || 'Нет'}
📅 <b>Дата/Время:</b> ${orderData.dateTime || 'Сразу'}

🗺 <a href="${mapLink}"><b>📍 Открыть маршрут в Яндекс Картах</b></a>

<i>№ заказа: ${orderData.id}</i>
`;

    try {
        let approvedDrivers: { telegramId: string | bigint }[] = [];
        try {
            approvedDrivers = await prisma.driver.findMany({
                where: { status: 'APPROVED' }
            });
        } catch (dbError) {
            console.warn("Could not query SQLite DB for drivers (expected on read-only environments):", dbError);
        }

        const keyboard = orderData.id && orderData.id !== 'N/A'
            ? Markup.inlineKeyboard([
                Markup.button.callback('✅ Забрать заявку', `take_order_${orderData.id}`)
            ])
            : undefined;

        const orderIdNum = Number(orderData.id);

        // Send to all approved drivers
        if (approvedDrivers.length > 0) {
            for (const driver of approvedDrivers) {
                try {
                    const sentMsg = await botInstance.telegram.sendMessage(driver.telegramId.toString(), message, {
                        parse_mode: 'HTML',
                        reply_markup: keyboard?.reply_markup
                    });

                    if (!isNaN(orderIdNum)) {
                        await prisma.broadcastMessage.create({
                            data: {
                                orderId: orderIdNum,
                                telegramId: BigInt(driver.telegramId.toString()),
                                messageId: sentMsg.message_id
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Failed to send to driver ${driver.telegramId}:`, err);
                }
            }
        } else {
            // Fallback to admin/chat ID if nobody is approved yet or DB failed
            if (chatId) {
                const sentMsg = await botInstance.telegram.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard?.reply_markup
                });
                if (!isNaN(orderIdNum)) {
                    await prisma.broadcastMessage.create({
                        data: {
                            orderId: orderIdNum,
                            telegramId: BigInt(chatId),
                            messageId: sentMsg.message_id
                        }
                    });
                }
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
