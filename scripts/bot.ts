import { Telegraf, Markup } from 'telegraf';
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
const adminId = process.env.TELEGRAM_CHAT_ID;

// Helper to generate the main menu keyboard
const getMainMenu = (chatId: string) => {
    const buttons = [
        ['📊 Статистика', '🚗 Мои заказы']
    ];

    // Admin gets extra buttons
    if (chatId === adminId) {
        buttons.push(['📥 Выгрузить EXCEL', '🗑 Очистить БД']);
        buttons.push(['🌐 Панель управления на сайте']);
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

        if (!driver) {
            // Auto-approve the admin, others are PENDING
            const isInitialAdmin = (telegramIdStr === adminId);
            driver = await prisma.driver.create({
                data: {
                    telegramId: telegramIdBigInt,
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    status: isInitialAdmin ? 'APPROVED' : 'PENDING'
                }
            });

            if (isInitialAdmin) {
                return ctx.reply('Добро пожаловать, Админ! Вы автоматически одобрены.', getMainMenu(telegramIdStr));
            } else {
                return ctx.reply('Здравствуйте! Ваша заявка в систему GrandTransfer отправлена администратору. Дождитесь одобрения доступа.', Markup.removeKeyboard());
            }
        }

        if (driver.status === 'PENDING') {
            return ctx.reply('Ваша заявка все еще находится на рассмотрении у администратора.', Markup.removeKeyboard());
        } else if (driver.status === 'BANNED') {
            return ctx.reply('Доступ в систему заблокирован.', Markup.removeKeyboard());
        } else if (driver.status === 'APPROVED') {
            return ctx.reply('Добро пожаловать в рабочую панель водителя GrandTransfer! Ожидайте новых заказов.', getMainMenu(telegramIdStr));
        }
    } catch (e) {
        console.error('Error in /start:', e);
        ctx.reply('Произошла ошибка базы данных.');
    }
});

// Helper to check authorization before executing commands
const checkAuth = async (ctx: any): Promise<boolean> => {
    try {
        const id = BigInt(ctx.chat.id);
        const driver = await prisma.driver.findUnique({ where: { telegramId: id } });
        if (!driver || driver.status !== 'APPROVED') {
            ctx.reply('У вас нет доступа (либо вы заблокированы/в ожидании).');
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

bot.hears('📊 Статистика', async (ctx) => {
    if (!(await checkAuth(ctx))) return;

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
            tariffStatsStr = "<b>Заказов по тарифам:</b>\n" + tariffGroups.map(t => {
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
        await ctx.replyWithHTML(msg, getMainMenu(ctx.chat.id.toString()));
    } catch (e) {
        ctx.reply('❌ Ошибка при получении статистики.');
    }
});

bot.hears('🚗 Мои заказы', async (ctx) => {
    if (!(await checkAuth(ctx))) return;
    ctx.reply('Раздел "Мои заказы" в разработке. Сейчас вы будете получать уведомления в общий чат.');
});

bot.hears('🌐 Панель управления на сайте', (ctx) => {
    if (ctx.chat.id.toString() !== adminId) return;
    ctx.reply('Панель управления доступна по ссылке: https://межгород.com/admin/drivers\n\nPIN-код: 7878');
});

bot.hears('🗑 Очистить БД', async (ctx) => {
    if (ctx.chat.id.toString() !== adminId) return;
    try {
        await prisma.order.deleteMany({});
        ctx.reply('🗑 Статистика (все заявки) была успешно удалена из базы данных.');
    } catch (e) {
        ctx.reply('❌ Ошибка удаления данных.');
    }
});

bot.hears('📥 Выгрузить EXCEL', async (ctx) => {
    if (ctx.chat.id.toString() !== adminId) return;
    try {
        const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
        let csv = '\uFEFF';
        csv += "ID;Дата;Откуда;Куда;Тариф;Пассажиров;Сумма;Имя;Телефон;Комментарий\n";
        orders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            const safeComment = (o.comments || '').replace(/;/g, ',').replace(/\n/g, ' ');
            csv += `${o.id};${dateStr};${o.fromCity};${o.toCity};${o.tariff};${o.passengers};${o.priceEstimate || ''};${o.customerName};${o.customerPhone};${safeComment}\n`;
        });
        const buffer = Buffer.from(csv, 'utf8');
        await ctx.replyWithDocument(
            { source: buffer, filename: `orders_${new Date().toISOString().split('T')[0]}.csv` },
            { caption: '📄 Выгрузка БД' }
        );
    } catch (e) {
        ctx.reply('❌ Ошибка экспорта.');
    }
});

bot.launch().then(() => {
    console.log('🤖 Telegram bot is polling for commands...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
