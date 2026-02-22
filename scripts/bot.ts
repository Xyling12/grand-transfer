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

        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
        });

        let recentRevenue = 0;
        recentOrders.forEach(o => { recentRevenue += (o.priceEstimate || 0); });

        const formattedMsg = `
📊 <b>Статистика GrandTransfer</b>
────────────────
<b>За всё время:</b>
✅ Заявок оформлено: ${totalOrders}
💰 Выручка (оценочно): ~${sumResult._sum.priceEstimate || 0} ₽
────────────────
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

bot.launch().then(() => {
    console.log('🤖 Telegram bot is polling for commands...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
