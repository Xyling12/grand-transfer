import { Markup } from 'telegraf';
import { BotDeps } from './types';
import { checkAuth, findDriverByArg, getMainMenu, translateTariff, translateStatus } from './helpers';

export function registerAdminHandlers(deps: BotDeps) {
    const { bot, prisma, adminId } = deps;

    // --- Text Admin Commands ---
    bot.command('approve', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const args = ctx.message.text.split(' ').slice(1).join(' ');
        if (!args) return ctx.reply('Использование: /approve <Telegram_ID или Телефон>');

        try {
            const driver = await findDriverByArg(args, deps);
            if (!driver) return ctx.reply('Водитель не найден.');

            await prisma.driver.update({ where: { id: driver.id }, data: { status: 'APPROVED' } });
            ctx.reply(`✅ Водитель ${driver.fullFio || driver.firstName} одобрен!`);

            await bot.telegram.sendMessage(
                Number(driver.telegramId),
                '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nНапишите /start для начала работы.',
                { parse_mode: 'HTML', ...getMainMenu(driver.telegramId.toString(), driver.role, adminId) }
            ).catch(() => { });
        } catch (e: any) {
            ctx.reply(e.message || 'Ошибка выполнения команды.');
        }
    });

    bot.command('reject', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const parts = ctx.message.text.split(' ').slice(1);
        const arg = parts[0];
        const reason = parts.slice(1).join(' ');

        if (!arg) return ctx.reply('Использование: /reject <Telegram_ID или Телефон> [Причина]');

        try {
            const driver = await findDriverByArg(arg, deps);
            if (!driver) return ctx.reply('Водитель не найден.');

            await prisma.driver.update({ where: { id: driver.id }, data: { status: 'BANNED' } });

            const reasonText = reason ? `\nПричина: ${reason}` : '';
            ctx.reply(`❌ Водитель ${driver.fullFio || driver.firstName} отклонен.${reasonText}`);

            await bot.telegram.sendMessage(
                Number(driver.telegramId),
                `❌ <b>Ваша заявка отклонена администратором.</b>${reasonText}\nДоступ к системе закрыт.`,
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            ).catch(() => { });
        } catch (e: any) {
            ctx.reply(e.message || 'Ошибка выполнения команды.');
        }
    });

    bot.command('ban', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const parts = ctx.message.text.split(' ').slice(1);
        const arg = parts[0];
        const reason = parts.slice(1).join(' ');

        if (!arg) return ctx.reply('Использование: /ban <Telegram_ID или Телефон> [Причина]');

        try {
            const driver = await findDriverByArg(arg, deps);
            if (!driver) return ctx.reply('Водитель не найден.');

            await prisma.driver.update({ where: { id: driver.id }, data: { status: 'BANNED' } });

            const reasonText = reason ? `\nПричина: ${reason}` : '';
            ctx.reply(`🛑 Водитель ${driver.fullFio || driver.firstName} забанен.${reasonText}`);

            await bot.telegram.sendMessage(
                Number(driver.telegramId),
                `🛑 <b>Ваш аккаунт заблокирован администратором.</b>${reasonText}\nДоступ к заказам закрыт.`,
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            ).catch(() => { });
        } catch (e: any) {
            ctx.reply(e.message || 'Ошибка выполнения команды.');
        }
    });

    bot.command('unban', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const args = ctx.message.text.split(' ').slice(1).join(' ');
        if (!args) return ctx.reply('Использование: /unban <Telegram_ID или Телефон>');

        try {
            const driver = await findDriverByArg(args, deps);
            if (!driver) return ctx.reply('Водитель не найден.');

            await prisma.driver.update({ where: { id: driver.id }, data: { status: 'PENDING', role: 'USER' } });
            ctx.reply(`🔄 Пользователь ${driver.fullFio || driver.firstName} разбанен. Статус сброшен на PENDING — потребуется повторная верификация.`);

            await bot.telegram.sendMessage(
                Number(driver.telegramId),
                '🔄 <b>Администратор снял блокировку с вашего аккаунта!</b>\n\nДля продолжения работы необходимо пройти повторную верификацию. Напишите /start.',
                { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
            ).catch(() => { });
        } catch (e: any) {
            ctx.reply(e.message || 'Ошибка выполнения команды.');
        }
    });

    bot.command('add_driver', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) {
            return ctx.reply('Использование: /add_driver <Telegram_ID> <ФИО полностью> [Телефон]\nПример: /add_driver 123456789 Иванов Иван Иванович 89001234567');
        }

        const tgIdStr = args[0].replace(/[^\d]/g, '');
        if (!tgIdStr) return ctx.reply('Ошибка: Telegram_ID должен состоять только из цифр.');

        let phone = '';
        let fioParts = args.slice(1);
        const lastArg = fioParts[fioParts.length - 1];
        if (/^[\d\+\-\(\)\s]{10,}$/.test(lastArg)) {
            phone = lastArg;
            fioParts.pop();
        }
        const fio = fioParts.join(' ');

        try {
            const tgIdBig = BigInt(tgIdStr);
            let driver = await prisma.driver.findUnique({ where: { telegramId: tgIdBig } });

            if (driver) {
                driver = await prisma.driver.update({
                    where: { id: driver.id },
                    data: {
                        status: 'APPROVED',
                        fullFio: fio,
                        ...(phone ? { phone } : {})
                    }
                });
                ctx.reply(`✅ Существующий профиль обновлен и одобрен.\nВодитель: ${driver.fullFio}\nID: ${tgIdStr}`);
            } else {
                driver = await prisma.driver.create({
                    data: {
                        telegramId: tgIdBig,
                        status: 'APPROVED',
                        role: 'DRIVER',
                        fullFio: fio,
                        firstName: fio.split(' ')[0] || 'Водитель',
                        phone: phone || null,
                    }
                });
                ctx.reply(`✅ Создан новый профиль водителя (в обход проверки).\nВодитель: ${driver.fullFio}\nID: ${tgIdStr}`);
            }

            await bot.telegram.sendMessage(
                Number(tgIdBig),
                '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nНапишите /start для начала работы.',
                { parse_mode: 'HTML', ...getMainMenu(tgIdBig.toString(), driver.role, adminId) }
            ).catch((err) => {
                console.log("Could not notify added driver:", err.message);
                ctx.reply(`⚠️ Профиль создан, но отправить уведомление водителю не удалось. Возможно, он еще ни разу не нажимал /start в боте.`);
            });
        } catch (e: any) {
            ctx.reply(e.message || 'Ошибка выполнения команды. Проверьте правильность ID.');
        }
    });

    // --- Settings ---
    bot.hears('⚙️ Настройки', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        try {
            let settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (!settings) {
                settings = await prisma.botSettings.create({ data: { id: 1, protectContent: true } });
            }

            const msg = `⚙️ <b>Параметры безопасности бота</b>\n\nТекущая конфигурация:\nЗащита контента (копирование/пересылка сообщений с контактами): <b>${settings.protectContent ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА'}</b>\n\n<i>Эта настройка применяется с момента переключения ко всем новым заявкам, отправляемым водителям. Если выключить — сообщения можно будет пересылать.</i>`;

            const keyboard = {
                inline_keyboard: [
                    [{ text: `🛡 Защита контента: ${settings.protectContent ? 'ВКЛ' : 'ВЫКЛ'}`, callback_data: 'toggle_protection' }]
                ]
            };

            await ctx.replyWithHTML(msg, { reply_markup: keyboard, protect_content: true });
        } catch (e) {
            ctx.reply('❌ Ошибка при получении настроек.', { protect_content: true });
        }
    });

    bot.action('toggle_protection', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

        try {
            let settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (!settings) {
                settings = await prisma.botSettings.create({ data: { id: 1, protectContent: true } });
            }

            const newValue = !settings.protectContent;
            await prisma.botSettings.update({
                where: { id: 1 },
                data: { protectContent: newValue }
            });

            const msg = `⚙️ <b>Параметры безопасности бота</b>\n\nТекущая конфигурация:\nЗащита контента (копирование/пересылка сообщений с контактами): <b>${newValue ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА'}</b>\n\n<i>Эта настройка применяется с момента переключения ко всем новым заявкам, отправляемым водителям. Если выключить — сообщения можно будет пересылать.</i>`;

            const keyboard = {
                inline_keyboard: [
                    [{ text: `🛡 Защита контента: ${newValue ? 'ВКЛ' : 'ВЫКЛ'}`, callback_data: 'toggle_protection' }]
                ]
            };

            await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
            await ctx.answerCbQuery(`Защита контента теперь ${newValue ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА'}`, { show_alert: false });
        } catch (e) {
            await ctx.answerCbQuery('Ошибка обновления настроек');
        }
    });

    // --- Help ---
    const handleHelp = async (ctx: any) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth) return;

        let msg = `🤖 <b>Справка по боту GrandTransfer (v2.0.0)</b>\n\n`;

        // Driver section — always shown
        msg += `🚗 <b>Функции Водителя:</b>\n`;
        msg += `• <b>🚗 Мои заказы:</b> Просмотр активных заявок с полной информацией, контактами клиента и маршрутом.\n`;
        msg += `• <b>📋 Доступные заявки:</b> Список свободных заявок. Нажмите «✅ Забрать» чтобы взять.\n`;
        msg += `• <b>📚 История заявок:</b> Завершённые и отменённые заявки.\n`;
        msg += `• <b>💬 Чат:</b> Ссылка для вступления в группу водителей.\n`;
        msg += `• <b>📩 Мои обращения:</b> Просмотр созданных тикетов и их статусов.\n`;
        msg += `• <b>🆘 Написать в поддержку:</b> Создать обращение к администрации.\n`;
        msg += `• <b>🛠 Найдена ошибка:</b> Отправить баг-репорт разработчикам.\n\n`;

        if (role === 'DISPATCHER' || role === 'ADMIN') {
            msg += `🎧 <b>Функции Диспетчера:</b>\n`;
            msg += `• <b>🆕 Заказы без работы:</b> Новые заявки с сайта — полные данные клиента.\n`;
            msg += `• <b>👀 Активные заявки:</b> Все заявки в работе, их статусы и исполнители.\n`;
            msg += `• <b>🚗 Мои заявки:</b> Курируемые заказы с кнопками управления.\n`;
            msg += `• <b>📤 Отправить водителям:</b> Публикация заказа в ленту без контактов.\n`;
            msg += `• <b>📋 Полная заявка:</b> Детали, редактирование полей, отмена.\n`;
            msg += `• <b>📞 Обратная связь:</b> Телефон клиента после выполнения заявки.\n\n`;
        }

        if (role === 'ADMIN') {
            msg += `👑 <b>Функции Администратора:</b>\n`;
            msg += `• <b>Верификация:</b> <code>/approve</code>, <code>/reject</code>, <code>/ban</code>, <code>/unban</code>\n`;
            msg += `• <b>Быстрое добавление:</b> <code>/add_driver ID ФИО Телефон</code>\n`;
            msg += `• <b>👥 Пользователи:</b> Поиск, роли, бан, просмотр заказов.\n`;
            msg += `• <b>📊 Статистика:</b> По периодам (день/неделя/месяц/всё).\n`;
            msg += `• <b>📥 EXCEL:</b> Выгрузка заказов, обращений, журнала.\n`;
            msg += `• <b>🐛 Баг-репорты:</b> Все репорты с историей переписки.\n`;
            msg += `• <b>📩 Тикеты в работе:</b> Активные обращения пользователей.\n`;
            msg += `• <b>💻 CRM:</b> Веб-панель управления.\n\n`;
        }

        msg += `\n📌 <b>Что нового (v2.0.0):</b>\n`;
        msg += `- 📱 Маршрут: кнопки Навигатор + Браузер\n`;
        msg += `- 🔒 Водитель может взять только 1 заявку\n`;
        msg += `- 📋 Полная информация при взятии заявки\n`;
        msg += `- 📞 Обратная связь с клиентом для диспетчера\n`;
        msg += `- 📜 История переписки в баг-репортах и тикетах\n`;
        msg += `- 🛠 Кнопка «Найдена ошибка» для всех\n`;
        msg += `- ⚙️ Регистрация только через CRM\n`;
        msg += `- 🔄 Автосинхронизация БД при перезапуске\n`;
        msg += `\n<i>⚠️ Для обновления меню нажмите /start</i>\n`;

        ctx.replyWithHTML(msg, { protect_content: role !== 'ADMIN' });

    };

    bot.hears('ℹ️ Справка', async (ctx) => { handleHelp(ctx); });
    bot.command('help', async (ctx) => { handleHelp(ctx); });

    // --- Clear Chat ---
    bot.command('clear', async (ctx) => {
        try {
            const messageId = ctx.message.message_id;
            let deletedCount = 0;
            for (let i = 0; i < 50; i++) {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, messageId - i);
                    deletedCount++;
                } catch (e) {
                    if (deletedCount > 5) break;
                }
            }

            const reply = await ctx.reply('✨ Чат очищен.');
            setTimeout(() => {
                ctx.telegram.deleteMessage(ctx.chat.id, reply.message_id).catch(() => { });
            }, 3000);
        } catch (e) {
            console.error('Failed to clear chat:', e);
        }
    });

    // --- Version ---
    bot.command('version', (ctx) => {
        const versionMsg = `
🤖 **Grand Transfer Bot**
Версия: \`v1.7.0\`
Обновлено: Февраль 2026

**Что нового (1.7.0):**
- ✏️ Редактирование полей заявки (админ/диспетчер)
- ❌ Отмена заказа с подтверждением уведомлений
- 📅 Дата/время поездки в заявках
- 📊 Статистика с фильтрами по периодам
- 📜 Журнал аудита всех админ-действий
- 📊 CRM Dashboard — обзор всей системы
- 🛡 Rate limiting для API

**Что нового (1.6.2):**
- 🔔 Уведомления при бане/удалении/смене роли
- 📋 Кнопка «Ожидающие регистрацию» для админов
`;
        ctx.reply(versionMsg, { parse_mode: 'Markdown' });
    });

    // --- Chat Link ---
    bot.hears('💬 Чат', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth) return;

        const groupId = process.env.TELEGRAM_GROUP_ID || '-1003744157897';

        if (!groupId) {
            return ctx.reply('⚠️ Ссылка на общий чат пока не настроена.', { protect_content: true });
        }

        try {
            const expireDate = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
            const inviteLink = await ctx.telegram.createChatInviteLink(groupId, {
                expire_date: expireDate,
                member_limit: 1,
                name: `Invite for ${ctx.from.first_name}`
            });

            await ctx.reply(`🔗 <b>Ваша индивидуальная ссылка в чат водителей:</b>\n\n${inviteLink.invite_link}\n\n<i>Ссылка действительна 24 часа и рассчитана на одно вступление. Передавать её третьим лицам бессмысленно.</i>`, { parse_mode: 'HTML', protect_content: true });
        } catch (err) {
            console.error('Fail generate personal chat link', err);
            ctx.reply('❌ Не удалось получить ссылку. Возможно, бот не добавлен в группу или не имеет прав.', { protect_content: true });
        }
    });

    // --- CRM ---
    bot.hears('💻 CRM Система', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;
        ctx.reply('Панель управления доступна по ссылке: https://xn--c1acbe2apap.com/admin/drivers', { protect_content: true });
    });

    bot.hears('🌐 Панель на сайте', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;
        ctx.reply('Панель управления доступна по ссылке: https://xn--c1acbe2apap.com/admin/drivers', { protect_content: true });
    });

    // --- Clear DB ---
    bot.hears('🗑 Очистить БД', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        const orderCount = await prisma.order.count();
        ctx.reply(
            `⚠️ <b>Вы уверены?</b>\n\nЭто действие удалит <b>ВСЕ ${orderCount} заявок</b> из базы данных. Отменить будет невозможно.`,
            {
                parse_mode: 'HTML',
                protect_content: true,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🗑 Да, удалить всё', callback_data: 'confirm_clear_db' }],
                        [{ text: '❌ Отмена', callback_data: 'cancel_clear_db' }]
                    ]
                }
            }
        );
    });

    bot.action('confirm_clear_db', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

        try {
            const deletedCount = await prisma.order.deleteMany({});
            await ctx.editMessageText(`🗑 Удалено <b>${deletedCount.count}</b> заявок из базы данных.`, { parse_mode: 'HTML' });
            await ctx.answerCbQuery('База очищена', { show_alert: false });
        } catch (e) {
            await ctx.answerCbQuery('❌ Ошибка удаления данных.', { show_alert: true });
        }
    });

    bot.action('cancel_clear_db', async (ctx) => {
        await ctx.editMessageText('✅ Операция отменена. База данных не тронута.');
        await ctx.answerCbQuery();
    });

    // --- Broadcast ---
    bot.hears('📢 Рассылка', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;
        ctx.reply('Для того чтобы отправить сообщение ВСЕМ пользователям бота (включая водителей), напишите команду <b>/send</b> и ваш текст через пробел.\n\nНапример:\n<code>/send Вышло обновление! Чтобы появились новые функции, напишите /start</code>', { parse_mode: 'HTML', protect_content: true });
    });

    bot.command('send', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
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
                } catch (e) { }
            }

            ctx.reply(`✅ Рассылка завершена!\nУспешно доставлено: ${successCount} из ${users.length} пользователей.`, { protect_content: true });
        } catch (e) {
            ctx.reply('❌ Ошибка при рассылке.', { protect_content: true });
        }
    });

    // --- Invite Link (Manual Admin Command) ---
    bot.command('invite', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || ctx.chat.id.toString() !== adminId) return;

        const groupId = process.env.TELEGRAM_GROUP_ID || '-1003744157897';

        if (!groupId) {
            return ctx.reply('⚠️ ID группы не настроен (TELEGRAM_GROUP_ID). Добавьте бота в группу и выдайте ему права администратора, затем я смогу генерировать ссылки.', { protect_content: true });
        }

        try {
            const expireDate = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
            const inviteLink = await ctx.telegram.createChatInviteLink(groupId, {
                expire_date: expireDate,
                member_limit: 1,
                name: `Invite for ${ctx.from.first_name}`
            });

            await ctx.reply(`🔗 <b>Одноразовая ссылка в закрытый чат водителей:</b>\n\n${inviteLink.invite_link}\n\n<i>Ссылка действительна 24 часа для одного(1) человека.</i>`, { parse_mode: 'HTML', protect_content: true });
        } catch (err) {
            console.error('Fail generate link', err);
            ctx.reply('❌ Ошибка генерации ссылки. Проверьте, что бот является Администратором в нужной группе.', { protect_content: true });
        }
    });

    // --- Pending Registrations ---
    bot.hears('📋 Ожидающие регистрацию', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        try {
            const pending = await prisma.driver.findMany({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'desc' }
            });

            if (pending.length === 0) {
                return ctx.reply('✅ Нет ожидающих регистрацию.', { protect_content: true });
            }

            await ctx.reply(`📋 <b>Ожидающие регистрацию: ${pending.length}</b>`, { parse_mode: 'HTML', protect_content: true });

            for (const d of pending) {
                const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
                const fio = d.fullFio ? `\nФИО: <b>${d.fullFio}</b>` : '';
                const phone = d.phone ? `\n📱 Тел: <b>${d.phone}</b>` : '';
                const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
                let text = `👤 <b>${name}</b>${fio}${phone}\nДата: ${dateStr}\nTG ID: <code>${d.telegramId}</code>`;

                const keyboard = {
                    inline_keyboard: [
                        [
                            { text: '💻 Одобрить / Отклонить в CRM', url: 'https://xn--c1acbe2apap.com/admin/drivers' }
                        ]
                    ]
                };

                await ctx.replyWithHTML(text, { reply_markup: keyboard, protect_content: true });
            }
        } catch (err) {
            ctx.reply('❌ Ошибка получения списка.', { protect_content: true });
        }
    });

    // --- User Panel ---
    bot.hears('👥 Пользователи', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        try {
            const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
            if (drivers.length === 0) return ctx.reply("В базе нет пользователей.", { protect_content: true });

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

                const buttons = buildUserButtons(d, ctx.chat?.id.toString() || '', adminId);
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

    // --- Search User ---
    bot.action('search_user', async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return;

        await ctx.reply('Введите Telegram ID или @username пользователя для поиска:', {
            reply_markup: { force_reply: true },
            protect_content: false
        });
        await ctx.answerCbQuery();
    });

    // --- User Search Reply Listener ---
    bot.on('text', async (ctx, next) => {
        const replyToMsg = ctx.message.reply_to_message as any;
        if (replyToMsg && replyToMsg.text && replyToMsg.text.includes('Введите Telegram ID или @username')) {
            const { auth, role } = await checkAuth(ctx, deps);
            if (!auth || role !== 'ADMIN') return;

            let searchStr = ctx.message.text.trim();
            let d = null;

            try {
                if (/^\d+$/.test(searchStr)) {
                    d = await prisma.driver.findUnique({ where: { telegramId: BigInt(searchStr) } });
                } else {
                    if (searchStr.startsWith('@')) {
                        searchStr = searchStr.substring(1);
                    }
                    d = await prisma.driver.findFirst({ where: { username: searchStr } });
                }

                if (!d) {
                    return ctx.reply('Пользователь не найден.', { protect_content: role !== 'ADMIN' });
                }

                const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
                let text = `🔍 <b>Найден Пользователь</b>\n\n👤 <b>${name}</b>\nРоль: <b>${d.role}</b>\nСтатус: <b>${d.status}</b>\nTG ID: <code>${d.telegramId}</code>`;

                const buttons = buildUserButtons(d, ctx.chat?.id.toString() || '', adminId);
                const keyboardRows = [];
                for (let i = 0; i < buttons.length; i += 2) {
                    keyboardRows.push(buttons.slice(i, i + 2));
                }

                return ctx.replyWithHTML(text, { ...Markup.inlineKeyboard(keyboardRows), protect_content: role !== 'ADMIN' });
            } catch (err) {
                ctx.reply('❌ Ошибка поиска.', { protect_content: role !== 'ADMIN' });
            }
        } else {
            return next();
        }
    });

    // --- Admin Panel Callbacks ---
    bot.action(/^approve_(\d+)$/, async (ctx) => {
        const telegramId = BigInt(ctx.match[1]);
        try {
            const updatedDriver = await prisma.driver.update({ where: { telegramId }, data: { status: 'APPROVED', role: 'DRIVER' } });
            await ctx.answerCbQuery('Одобрен как Водитель');
            await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n✅ ОДОБРЕН КАК ВОДИТЕЛЬ');
            try {
                await bot.telegram.sendMessage(Number(telegramId), '✅ Ваша заявка одобрена! Напишите /start для начала работы.', { ...getMainMenu(telegramId.toString(), updatedDriver.role, adminId), protect_content: true });
            } catch (e) { }
            try { await prisma.auditLog.create({ data: { action: 'APPROVE_USER', actorId: ctx.from?.id?.toString() || '', actorName: ctx.from?.first_name || 'Admin', targetId: telegramId.toString(), targetName: updatedDriver.fullFio || updatedDriver.firstName || '', details: 'Одобрен как Водитель' } }); } catch (e) { }
        } catch {
            await ctx.answerCbQuery('Ошибка обновления');
        }
    });

    bot.action(/^approve_disp_(\d+)$/, async (ctx) => {
        const telegramId = BigInt(ctx.match[1]);
        try {
            const updatedDriver = await prisma.driver.update({ where: { telegramId }, data: { status: 'APPROVED', role: 'DISPATCHER' } });
            await ctx.answerCbQuery('Одобрен как Диспетчер');
            await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n✅ ОДОБРЕН КАК ДИСПЕТЧЕР');
            try {
                await bot.telegram.sendMessage(Number(telegramId), '✅ Ваша заявка одобрена! Напишите /start для начала работы.', { ...getMainMenu(telegramId.toString(), updatedDriver.role, adminId), protect_content: true });
            } catch (e) { }
            try { await prisma.auditLog.create({ data: { action: 'APPROVE_USER', actorId: ctx.from?.id?.toString() || '', actorName: ctx.from?.first_name || 'Admin', targetId: telegramId.toString(), targetName: updatedDriver.fullFio || updatedDriver.firstName || '', details: 'Одобрен как Диспетчер' } }); } catch (e) { }
        } catch {
            await ctx.answerCbQuery('Ошибка обновления');
        }
    });

    bot.action(/^ban_(\d+)$/, async (ctx) => {
        const telegramId = BigInt(ctx.match[1]);
        try {
            const bannedUser = await prisma.driver.update({ where: { telegramId }, data: { status: 'BANNED' } });
            await ctx.answerCbQuery('Пользователь забанен');
            await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n🚫 СТАТУС ИЗМЕНЕН НА: BANNED');
            try {
                await bot.telegram.sendMessage(Number(telegramId), '🚫 Ваш аккаунт был заблокирован администратором. Доступ к системе ограничен.', { reply_markup: { remove_keyboard: true } });
            } catch (e) { }
            try { await prisma.auditLog.create({ data: { action: 'BAN_USER', actorId: ctx.from?.id?.toString() || '', actorName: ctx.from?.first_name || 'Admin', targetId: telegramId.toString(), targetName: bannedUser.fullFio || bannedUser.firstName || '' } }); } catch (e) { }
        } catch {
            await ctx.answerCbQuery('Ошибка обновления');
        }
    });

    bot.action(/^delete_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав');

        const telegramId = BigInt(ctx.match[1]);
        try {
            const deletedUser = await prisma.driver.findUnique({ where: { telegramId } });
            try {
                await bot.telegram.sendMessage(Number(telegramId), '⚠️ Ваш аккаунт был удалён из системы администратором. Для повторной регистрации напишите /start.', { reply_markup: { remove_keyboard: true } });
            } catch (e) { }
            await prisma.driver.delete({ where: { telegramId } });
            await ctx.answerCbQuery('Пользователь удален из базы');
            await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n🗑 ПОЛЬЗОВАТЕЛЬ УДАЛЕН');
            try { await prisma.auditLog.create({ data: { action: 'DELETE_USER', actorId: ctx.from?.id?.toString() || '', actorName: ctx.from?.first_name || 'Admin', targetId: telegramId.toString(), targetName: deletedUser?.fullFio || deletedUser?.firstName || '' } }); } catch (e) { }
        } catch {
            await ctx.answerCbQuery('Ошибка удаления. Возможно, за ним числятся заказы.');
        }
    });

    bot.action(/^setrole_(\d+)_([A-Z]+)$/, async (ctx) => {
        const telegramId = BigInt(ctx.match[1]);
        const newRole = ctx.match[2];
        const roleNames: Record<string, string> = { 'ADMIN': 'Администратор', 'DISPATCHER': 'Диспетчер', 'DRIVER': 'Водитель', 'USER': 'Пользователь' };
        const roleName = roleNames[newRole] || newRole;
        try {
            const updatedUser = await prisma.driver.update({ where: { telegramId }, data: { role: newRole } });
            await ctx.answerCbQuery(`Роль изменена на ${roleName}`);
            await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + `\n\n👑 РОЛЬ ИЗМЕНЕНА НА: ${roleName}`);
            try {
                await bot.telegram.sendMessage(Number(telegramId), `👑 Вам присвоена новая роль: <b>${roleName}</b>!\n\nНажмите /start чтобы обновить меню.`, { parse_mode: 'HTML', ...getMainMenu(telegramId.toString(), newRole, adminId), protect_content: true });
            } catch (e) { }
            try { await prisma.auditLog.create({ data: { action: 'CHANGE_ROLE', actorId: ctx.from?.id?.toString() || '', actorName: ctx.from?.first_name || 'Admin', targetId: telegramId.toString(), targetName: updatedUser.fullFio || updatedUser.firstName || '', details: `Роль → ${roleName}` } }); } catch (e) { }
        } catch {
            await ctx.answerCbQuery('Ошибка обновления');
        }
    });

    bot.action(/^view_orders_(\d+)$/, async (ctx) => {
        const { auth, role } = await checkAuth(ctx, deps);
        if (!auth || role !== 'ADMIN') {
            return ctx.answerCbQuery('Нет прав доступа', { show_alert: true });
        }

        const telegramId = BigInt(ctx.match[1]);
        try {
            const targetDriver = await prisma.driver.findUnique({ where: { telegramId } });
            if (!targetDriver) return ctx.answerCbQuery('Водитель не найден.');

            const orders = await prisma.order.findMany({
                where: targetDriver.role === 'DISPATCHER' ? { dispatcherId: targetDriver.id } : { driverId: targetDriver.id },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            if (orders.length === 0) {
                return ctx.answerCbQuery('У пользователя нет заявок в работе.', { show_alert: true });
            }

            let msg = `📦 <b>Заявки (${targetDriver.role === 'DISPATCHER' ? 'Диспетчер' : 'Водитель'}) ${targetDriver.firstName || 'Без имени'}:</b>\n\n`;
            orders.forEach((o: any) => {
                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
                msg += `📋 <b>Заявка № ${o.id}</b> (создана ${dateStr})\n` +
                    `⏳ <b>Статус:</b> ${translateStatus(o.status)}\n` +
                    `📍 <b>Откуда:</b> ${o.fromCity}\n` +
                    `🏁 <b>Куда:</b> ${o.toCity}\n` +
                    `🚕 <b>Тариф:</b> ${translateTariff(o.tariff)}\n` +
                    `👥 <b>Пассажиров:</b> ${o.passengers}\n` +
                    `💰 <b>Стоимость:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}\n\n` +
                    `📝 <b>Комментарий:</b> ${o.comments || 'Нет'}\n` +
                    `👤 <b>Клиент:</b> ${o.customerName}\n` +
                    `📞 <b>Телефон:</b> ${o.customerPhone}\n` +
                    `👨‍✈️ <b>Исполнитель:</b> ${targetDriver.firstName || 'Без имени'} (@${targetDriver.username || 'Нет'})\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n`;
            });

            await ctx.answerCbQuery('Загружаем заявки...');
            await ctx.replyWithHTML(msg, { protect_content: true });
        } catch (err) {
            ctx.answerCbQuery('Ошибка получения заявок.');
        }
    });
}

// Helper to build user management buttons (extracted to avoid duplication)
function buildUserButtons(d: any, chatIdStr: string, adminId: string) {
    const buttons = [];
    if (d.status === 'PENDING') {
        buttons.push(Markup.button.callback('✅ Принять (Водитель)', `approve_${d.telegramId}`));
        buttons.push(Markup.button.callback('🎧 Принять (Диспетчер)', `approve_disp_${d.telegramId}`));
    }
    if (d.status !== 'BANNED') {
        buttons.push(Markup.button.callback('🚫 Забанить', `ban_${d.telegramId}`));
    }
    buttons.push(Markup.button.callback('🗑 Выгнать', `delete_${d.telegramId}`));

    if (chatIdStr === adminId) {
        if (d.role === 'USER' || d.role === 'DRIVER') {
            buttons.push(Markup.button.callback('👑 Админ', `setrole_${d.telegramId}_ADMIN`));
            buttons.push(Markup.button.callback('🎧 Диспетчер', `setrole_${d.telegramId}_DISPATCHER`));
        } else if (d.role === 'ADMIN' && d.telegramId.toString() !== adminId) {
            buttons.push(Markup.button.callback('🚗 Понизить в Водителя', `setrole_${d.telegramId}_DRIVER`));
            buttons.push(Markup.button.callback('🎧 Понизить в Диспетчера', `setrole_${d.telegramId}_DISPATCHER`));
        } else if (d.role === 'DISPATCHER') {
            buttons.push(Markup.button.callback('🚗 Сделать Водителем', `setrole_${d.telegramId}_DRIVER`));
            buttons.push(Markup.button.callback('👑 Админ', `setrole_${d.telegramId}_ADMIN`));
        }
    } else {
        if (d.role === 'ADMIN') {
            // Cannot modify another admin
        } else if (d.role === 'USER' || d.role === 'DRIVER') {
            buttons.push(Markup.button.callback('🎧 Диспетчер', `setrole_${d.telegramId}_DISPATCHER`));
        } else if (d.role === 'DISPATCHER') {
            buttons.push(Markup.button.callback('🚗 Сделать Водителем', `setrole_${d.telegramId}_DRIVER`));
        }
    }

    if (d.status === 'BANNED') {
        buttons.push(Markup.button.callback('🔄 Восстановить', `approve_${d.telegramId}`));
    }
    buttons.push(Markup.button.callback('📦 Заказы', `view_orders_${d.telegramId}`));

    return buttons;
}
