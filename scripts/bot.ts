import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

const bot = new Telegraf(token);
const prisma = new PrismaClient();

bot.start((ctx) => {
    ctx.reply(`Привет! Я бот для управления заказами GrandTransfer.\nТвой Chat ID: ${ctx.chat.id}\nДля получения статистики отправь команду /stats`);
});

bot.command('stats', async (ctx) => {
    try {
        const totalOrders = await prisma.order.count();

        const sumResult = await prisma.order.aggregate({
            _sum: {
                priceEstimate: true,
            },
        });

        // Get count per dataset (grouped by tariff)
        const tariffGroups = await prisma.order.groupBy({
            by: ['tariff'],
            _count: {
                tariff: true,
            },
            orderBy: {
                _count: {
                    tariff: 'desc'
                }
            }
        });

        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
        });

        let recentRevenue = 0;
        recentOrders.forEach(o => { recentRevenue += (o.priceEstimate || 0); });

        // Format tariff stats
        let tariffStatsStr = "";
        if (tariffGroups.length > 0) {
            tariffStatsStr = "<b>Заказов по тарифам:</b>\n" + tariffGroups.map(t => {
                const capitalizedName = t.tariff ? t.tariff.charAt(0).toUpperCase() + t.tariff.slice(1) : 'Не указан';
                return `- ${capitalizedName}: ${t._count.tariff} шт.`;
            }).join('\n') + "\n────────────────";
        } else {
            tariffStatsStr = "<b>Заказов по тарифам:</b> Пока пусто\n────────────────";
        }

        const formattedMsg = `
📊 <b>Статистика GrandTransfer</b>
────────────────
<b>За всё время:</b>
✅ Заявок оформлено: ${totalOrders}
💰 Выручка (оценочно): ~${sumResult._sum.priceEstimate || 0} ₽
────────────────
${tariffStatsStr}
<b>Последние 10 заявок:</b>
🚗 Выручка: ~${recentRevenue} ₽
        `.trim();

        await ctx.replyWithHTML(formattedMsg);
    } catch (e) {
        console.error(e);
        ctx.reply('❌ Ошибка при получении статистики из базы данных.');
    }
});

// Кнопка для обнуления статистики (доступна только владельцу)
bot.command('reset', async (ctx) => {
    // Проверяем, что команду вызывает именно админ (чей Chat ID указан в .env)
    if (ctx.chat.id.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return ctx.reply('❌ У вас нет прав для сброса статистики.');
    }

    try {
        await prisma.order.deleteMany({});
        ctx.reply('🗑 Статистика (все заявки) была успешно удалена из базы данных. Счетчики обнулены.');
    } catch (e) {
        console.error('Failed to reset DB:', e);
        ctx.reply('❌ Произошла ошибка при удалении данных.');
    }
});

// Кнопка для выгрузки всех заказов в CSV (Excel)
bot.command('export', async (ctx) => {
    if (ctx.chat.id.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return ctx.reply('❌ У вас нет прав для выгрузки статистики.');
    }

    try {
        const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });

        // Add BOM for Excel UTF-8 display
        let csv = '\uFEFF';
        csv += "ID;Дата;Откуда;Куда;Тариф;Пассажиров;Сумма;Имя;Телефон;Комментарий\n";

        orders.forEach(o => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            const safeComment = (o.comments || '').replace(/;/g, ',').replace(/\n/g, ' ');
            csv += `${o.id};${dateStr};${o.fromCity};${o.toCity};${o.tariff};${o.passengers};${o.priceEstimate || ''};${o.customerName};${o.customerPhone};${safeComment}\n`;
        });

        const buffer = Buffer.from(csv, 'utf8');
        await ctx.replyWithDocument(
            { source: buffer, filename: `orders_grandtransfer_${new Date().toISOString().split('T')[0]}.csv` },
            { caption: '📄 Полная выгрузка базы заказов (можно открыть в Excel)' }
        );
    } catch (e) {
        console.error('Export error:', e);
        ctx.reply('❌ Произошла ошибка при экспорте.');
    }
});

bot.launch().then(() => {
    console.log('🤖 Telegram bot is polling for commands...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
