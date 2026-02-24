import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { cities } from '@/data/cities';

export async function sendOrderNotification(orderData: Record<string, string | number | null | undefined>): Promise<boolean> {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/['"]/g, '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').replace(/['"]/g, '').trim();

    if (!token || !chatId) {
        console.warn('Telegram bot is not configured properly (missing token or chat ID)');
        return false;
    }

    const fromCity = String(orderData.fromCity || '');
    const toCity = String(orderData.toCity || '');
    const checkpointName = orderData.checkpointName ? String(orderData.checkpointName) : '';

    const fromCityObj = cities.find(c => c.name.toLowerCase() === fromCity.toLowerCase());
    const toCityObj = cities.find(c => c.name.toLowerCase() === toCity.toLowerCase());

    const fallbackLoc1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(fromCity);
    const fallbackLoc2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(toCity);

    const pt1 = orderData.fromCoords ? String(orderData.fromCoords) : fallbackLoc1;
    const pt2 = orderData.toCoords ? String(orderData.toCoords) : fallbackLoc2;
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

<i>№ заказа: ${orderData.id}</i>
`;

    const sendTelegramMessage = async (targetChatId: string, text: string, replyMarkup?: any, protectContent: boolean = true) => {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const body: any = {
            chat_id: targetChatId,
            text: text,
            parse_mode: 'HTML',
        };
        if (protectContent) {
            body.protect_content = true;
        }
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Telegram API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
    };

    let anySuccess = false;

    try {
        let authorizedStaff: { telegramId: string | bigint, role: string }[] = [];
        try {
            authorizedStaff = await prisma.driver.findMany({
                where: {
                    status: 'APPROVED',
                    role: { in: ['ADMIN', 'DISPATCHER'] }
                },
                select: { telegramId: true, role: true }
            });
        } catch (dbError) {
            console.warn("Could not query SQLite DB for drivers (expected on read-only environments):", dbError);
        }

        const keyboardButtons = [];
        if (orderData.id && orderData.id !== 'N/A') {
            keyboardButtons.push([{ text: '🎧 Взять в работу', callback_data: `take_work_${orderData.id}` }]);
            keyboardButtons.push([{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${orderData.id}` }]);
        }
        keyboardButtons.push([{ text: '🗺 Открыть Яндекс Карты', url: mapLink }]);

        const keyboard = { inline_keyboard: keyboardButtons };

        const orderIdNum = Number(orderData.id);

        // Add Global protection fetch
        let protectContentGlobal = true;
        try {
            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (settings) {
                protectContentGlobal = settings.protectContent;
            }
        } catch (e) {
            console.warn("Could not query BotSettings. Using default (true).", e);
        }

        // Send to all Admins and Dispatchers
        if (authorizedStaff.length > 0) {
            for (const staff of authorizedStaff) {
                try {
                    const isAdmin = (staff.role === 'ADMIN' || staff.telegramId.toString() === chatId);
                    const protect = !isAdmin && protectContentGlobal; // Protect content if they are NOT an admin AND global setting is ON
                    const sentMsg = await sendTelegramMessage(staff.telegramId.toString(), message, keyboard, protect);
                    if (sentMsg) anySuccess = true;

                    if (!isNaN(orderIdNum) && sentMsg?.message_id) {
                        await prisma.broadcastMessage.create({
                            data: {
                                orderId: orderIdNum,
                                telegramId: BigInt(staff.telegramId.toString()),
                                messageId: sentMsg.message_id
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Failed to send to staff ${staff.telegramId}:`, err);
                }
            }
        } else {
            // Fallback to admin/chat ID if nobody is approved yet or DB failed
            if (chatId) {
                try {
                    const sentMsg = await sendTelegramMessage(chatId, message, keyboard, false); // Fallback is usually admin, so no protection
                    if (sentMsg) anySuccess = true;

                    if (!isNaN(orderIdNum) && sentMsg?.message_id) {
                        await prisma.broadcastMessage.create({
                            data: {
                                orderId: orderIdNum,
                                telegramId: BigInt(chatId),
                                messageId: sentMsg.message_id
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to notify fallback admin:', e);
                }
            }
        }
    } catch (e) {
        console.error('Failed to notify staff:', e);
    }

    return anySuccess;
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
    recentOrders.forEach((o: any) => recentRevenue += (o.priceEstimate || 0));

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
