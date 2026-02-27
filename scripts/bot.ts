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

const translateTariff = (tariff: string) => {
    switch (tariff?.toLowerCase()) {
        case 'standart': return 'Стандарт';
        case 'econom': return 'Эконом';
        case 'comfort': return 'Комфорт';
        case 'minivan': return 'Минивэн';
        case 'business': return 'Бизнес';
        default: return tariff;
    }
};

const translateStatus = (status: string, role?: string) => {
    switch (status) {
        case 'NEW': return 'Новая';
        case 'PROCESSING': return role === 'DISPATCHER' ? 'В обработке' : 'У диспетчера';
        case 'DISPATCHED': return 'Поиск водителя';
        case 'TAKEN': return 'Взят в работу';
        case 'COMPLETED': return 'Выполнена';
        case 'CANCELLED': return 'Отменена';
        default: return status;
    }
};

const formatOrderMessage = (o: any, role: string) => {
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const takenStr = o.takenAt ? new Date(o.takenAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const compStr = o.completedAt ? new Date(o.completedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : '';
    const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${encodeURIComponent(o.fromCity)}~${encodeURIComponent(o.toCity)}`;

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

// Helper to generate the main menu keyboard
const getMainMenu = (chatId: string, role: string) => {
    let buttons = [];

    if (role === 'ADMIN' || chatId === adminId) {
        // Полный доступ для админа
        buttons.push(['👀 Активные заявки', '💬 Чат']);
        buttons.push(['👥 Пользователи', '📢 Рассылка']);
        buttons.push(['📥 Выгрузить EXCEL', '📊 Статистика']);
        buttons.push(['🚗 Мои заявки', '📚 История заявок']);
        buttons.push(['✅ Выполненные заявки', '⚙️ Настройки']);
        buttons.push(['🗑 Очистить БД', '💻 CRM Система']);
        buttons.push(['ℹ️ Справка']);
    } else if (role === 'DISPATCHER') {
        // Скрываем лишнее для диспетчера, добавляем Мои заявки
        buttons.push(['👀 Активные заявки', '🚗 Мои заявки']);
        buttons.push(['📚 История заявок', '💬 Чат']);
        buttons.push(['ℹ️ Справка']);
    } else {
        // Regular DRIVER - скрываем статистику
        buttons.push(['🚗 Мои заказы', '📚 История заявок']);
        buttons.push(['💬 Чат', 'ℹ️ Справка']);
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
            // Check if this is the designated initial admin from .env
            if (isInitialAdmin) {
                driver = await prisma.driver.create({
                    data: {
                        telegramId: telegramIdBigInt,
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                        status: 'APPROVED',
                        role: 'ADMIN'
                    }
                });
                return ctx.reply('Добро пожаловать, Главный Администратор! Вы автоматически зарегистрированы и одобрены.', { ...getMainMenu(telegramIdStr, 'ADMIN'), protect_content: false });
            } else {
                // For regular users, show the registration button instead of auto-creating
                return ctx.reply(
                    'Здравствуйте! Добро пожаловать в Telegram-бот GrandTransfer.\n\nКем вы хотите стать?\n\n⚠️ Нажимая кнопки ниже, вы даете согласие на обработку ваших персональных данных (Имя, Фамилия, Telegram ID) в соответствии с ФЗ-152.',
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📝 Подать заявку (Водитель)', callback_data: 'register_role_DRIVER' }],
                                [{ text: '🎧 Подать заявку (Диспетчер)', callback_data: 'register_role_DISPATCHER' }]
                            ]
                        }
                    }
                );
            }
        } else if (isInitialAdmin && (driver.status !== 'APPROVED' || driver.role !== 'ADMIN')) {
            // Rescue admin if they logged in before the fix
            driver = await prisma.driver.update({
                where: { telegramId: telegramIdBigInt },
                data: { status: 'APPROVED', role: 'ADMIN' }
            });
            return ctx.reply('Добро пожаловать, Главный Администратор! Ваши права восстановлены.', { ...getMainMenu(telegramIdStr, 'ADMIN'), protect_content: false });
        }

        if (driver.status === 'PENDING') {
            return ctx.reply('Ваша заявка все еще находится на рассмотрении у администратора.', { reply_markup: { remove_keyboard: true } });
        } else if (driver.status === 'BANNED') {
            return ctx.reply('Доступ в систему заблокирован.', { reply_markup: { remove_keyboard: true } });
        } else if (driver.status === 'APPROVED') {
            return ctx.reply('Добро пожаловать в рабочую панель водителя GrandTransfer! Ожидайте новых заказов.', { ...getMainMenu(telegramIdStr, driver.role) });
        }
    } catch (e) {
        console.error('Error in /start:', e);
        ctx.reply('Произошла ошибка базы данных.');
    }
});

interface RegState {
    step: 'FIO' | 'PHONE' | 'PTS' | 'STS' | 'LICENSE' | 'CAR';
    role: 'DRIVER' | 'DISPATCHER';
    fullFio?: string;
    phone?: string;
    ptsNumber?: string;
    stsPhotoId?: string;
    licensePhotoId?: string;
    carPhotoId?: string;
    messageIdsToDelete: number[];
}

const pendingRegistrations = new Map<string, RegState>();

// Handle Role Selection Callbacks
bot.action(/register_role_(DRIVER|DISPATCHER)/, async (ctx) => {
    const role = ctx.match[1] as 'DRIVER' | 'DISPATCHER';
    const telegramIdBigInt = BigInt(ctx.chat?.id || 0);
    const tgIdStr = telegramIdBigInt.toString();

    try {
        // Check if already registered
        const existing = await prisma.driver.findUnique({ where: { telegramId: telegramIdBigInt } });
        if (existing) {
            return ctx.answerCbQuery('Вы уже подавали заявку.', { show_alert: true });
        }

        // Start registration state
        pendingRegistrations.set(tgIdStr, { step: 'FIO', role, messageIdsToDelete: [] });

        await ctx.answerCbQuery();

        const roleText = role === 'DRIVER' ? 'Водителя' : 'Диспетчера';
        const msg = await ctx.reply(`👤 <b>Регистрация ${roleText}</b>\n<b>Шаг 1: Ваше ФИО</b>\n\nПожалуйста, напишите ваши Фамилию, Имя и Отчество полностью (например: Иванов Иван Иванович).`, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
        });

        const state = pendingRegistrations.get(tgIdStr);
        if (state) state.messageIdsToDelete.push(msg.message_id);

    } catch (e) {
        console.error('Registration error:', e);
        ctx.answerCbQuery('Произошла ошибка при начале регистрации. Попробуйте еще раз позже.', { show_alert: true });
    }
});

// Intercept All Messages to handle the Registration State Machine
bot.on('message', async (ctx, next) => {
    const tgIdStr = ctx.chat.id.toString();
    const state = pendingRegistrations.get(tgIdStr);

    if (!state) {
        return next(); // Not in registration flow, continue to command handlers
    }

    try {
        // Step 1: FIO
        if (state.step === 'FIO') {
            const text = (ctx.message as any).text;
            if (!text || text.length < 5) {
                const m = await ctx.reply('⚠️ Пожалуйста, введите корректное ФИО текстом (например: Иванов Иван Иванович).');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            state.fullFio = text;
            state.step = 'PHONE';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = []; // reset for next steps

            const m2 = await ctx.reply('📱 <b>Шаг 2 из 5: Номер телефона</b>\n\nПожалуйста, нажмите кнопку «Поделиться контактом» ниже, либо введите номер вручную строго в формате, начиная с <b>+7</b> (например: +79991234567).', {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        [{ text: '☎️ Поделиться контактом', request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            state.messageIdsToDelete.push(m2.message_id);

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }
            return;
        }

        // Step 2: Phone
        if (state.step === 'PHONE') {
            const contact = (ctx.message as any).contact;
            const text = (ctx.message as any).text;

            let phone = '';
            if (contact && contact.phone_number) {
                // Contact payloads can omit the + sign, and start with 7 or 8. Normalize.
                let rawPhone = String(contact.phone_number).replace(/\D/g, '');
                if (rawPhone.startsWith('8')) rawPhone = '7' + rawPhone.slice(1);
                phone = '+' + rawPhone;
            } else if (text) {
                // Ensure manual typing strictly starts with +7 and contains exactly 11 digits total (7 + 10 digits)
                const cleanText = text.trim();
                if (/^\+7\d{10}$/.test(cleanText)) {
                    phone = cleanText;
                }
            }

            if (!phone) {
                const m = await ctx.reply('⚠️ Пожалуйста, нажмите кнопку «☎️ Поделиться контактом» внизу или отправьте корректный номер текстом <b>СТРОГО начиная с +7</b> (пример: +79991234567).', { parse_mode: 'HTML' });
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            state.phone = phone;

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = []; // reset for next steps

            if (state.role === 'DISPATCHER') {
                // Registration COMPLETE FOR DISPATCHER
                for (const mid of cleanupMsgs) {
                    ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
                }

                // Save to DB
                const telegramIdBigInt = BigInt(ctx.chat.id);
                await prisma.driver.create({
                    data: {
                        telegramId: telegramIdBigInt,
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                        fullFio: state.fullFio,
                        phone: state.phone,
                        status: 'PENDING',
                        role: 'DISPATCHER'
                    }
                });

                pendingRegistrations.delete(tgIdStr);

                await ctx.reply('✅ <b>Заявка Диспетчера успешно отправлена!</b>\n\nВаша заявка отправлена администратору на рассмотрение. Ожидайте уведомления.', { parse_mode: 'HTML' });

                // Notify admins
                try {
                    const admins = await prisma.driver.findMany({ where: { role: 'ADMIN', status: 'APPROVED' } });
                    const userStr = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || `ID: ${ctx.from.id}`);
                    const adminMsg = `🚨 <b>Новая заявка на регистрацию (Диспетчер)!</b>\n\n👤 ФИО: ${state.fullFio}\nTG: ${userStr}\n📱 Тел: ${state.phone}`;

                    const adminKeyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ Одобрить как Диспетчера', callback_data: `verify_approve_disp_${telegramIdBigInt}` },
                                { text: '❌ Отклонить', callback_data: `verify_reject_${telegramIdBigInt}` }
                            ],
                            [
                                { text: '💻 Открыть CRM', url: 'https://xn--c1acbe2apap.com/admin/drivers' }
                            ]
                        ]
                    };

                    for (const ad of admins) {
                        await bot.telegram.sendMessage(
                            Number(ad.telegramId),
                            adminMsg,
                            { parse_mode: 'HTML', protect_content: true, reply_markup: adminKeyboard }
                        ).catch(() => { });
                    }
                } catch (adminErr) {
                    console.error('Failed to notify admins of new registration:', adminErr);
                }
                return;
            } else {
                // If DRIVER, proceed to PTS
                state.step = 'PTS';

                const m2 = await ctx.reply('📄 <b>Шаг 3 из 6: Фото ПТС</b>\n\nПришлите ФОТО Паспорта Транспортного Средства (ПТС).', {
                    parse_mode: 'HTML',
                    reply_markup: { remove_keyboard: true } // Remove contact button
                });
                state.messageIdsToDelete.push(m2.message_id);

                // Cleanup old msgs
                for (const mid of cleanupMsgs) {
                    ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
                }
                return;
            }
        }

        // Step 3: PTS
        if (state.step === 'PTS') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.ptsNumber = largestPhoto.file_id; // Storing PTS Photo ID here
            state.step = 'STS';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            const m2 = await ctx.reply('🪪 <b>Шаг 4 из 6: Фото СТС</b>\n\nПожалуйста, отправьте ФОТО Свидетельства о регистрации ТС (лицевую сторону с Гос. знаком).', { parse_mode: 'HTML' });
            state.messageIdsToDelete.push(m2.message_id);

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }
            return;
        }

        // Step 4: STS
        if (state.step === 'STS') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.stsPhotoId = largestPhoto.file_id;
            state.step = 'LICENSE';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            const m2 = await ctx.reply('🪪 <b>Шаг 5 из 6: Фото Водительских прав</b>\n\nПожалуйста, отправьте ФОТО вашего Водительского удостоверения (с обеих сторон или лицевую часть).', { parse_mode: 'HTML' });
            state.messageIdsToDelete.push(m2.message_id);

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }
            return;
        }

        // Step 5: LICENSE
        if (state.step === 'LICENSE') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.licensePhotoId = largestPhoto.file_id;
            state.step = 'CAR';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            const m2 = await ctx.reply('🚙 <b>Шаг 6 из 6: Фото автомобиля</b>\n\nПожалуйста, отправьте ФОТО вашей машины сбоку так, чтобы был отчетливо виден государственный номер.', { parse_mode: 'HTML' });
            state.messageIdsToDelete.push(m2.message_id);

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }
            return;
        }

        // Step 6: CAR
        if (state.step === 'CAR') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО автомобиля.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.carPhotoId = largestPhoto.file_id;

            // Registration COMPLETE
            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }

            // Save to DB
            const telegramIdBigInt = BigInt(ctx.chat.id);
            await prisma.driver.create({
                data: {
                    telegramId: telegramIdBigInt,
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    fullFio: state.fullFio,
                    phone: state.phone,
                    ptsNumber: state.ptsNumber, // This is actually PTS Photo ID now
                    stsPhotoId: state.stsPhotoId,
                    licensePhotoId: state.licensePhotoId,
                    carPhotoId: state.carPhotoId,
                    status: 'PENDING',
                    role: 'DRIVER'
                }
            });

            pendingRegistrations.delete(tgIdStr);

            await ctx.reply('✅ <b>Заявка успешно отправлена!</b>\n\nВы предоставили все необходимые документы. Ваша заявка отправлена администратору на рассмотрение. Вы получите уведомление о доступе.', { parse_mode: 'HTML' });

            // Notify admins
            try {
                const admins = await prisma.driver.findMany({ where: { role: 'ADMIN', status: 'APPROVED' } });
                const userStr = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || `ID: ${ctx.from.id}`);
                const adminMsg = `🚨 <b>Новая заявка на регистрацию!</b>\n\n👤 ФИО: ${state.fullFio}\nTG: ${userStr}\n📱 Тел: ${state.phone}\n\nЗайдите в раздел 👥 <b>Пользователи</b> на сайте, чтобы просмотреть фотографии ПТС, СТС и автомобиля, после чего одобрите или отклоните заявку.`;

                // Add inline buttons for quick approve/reject
                const adminKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '✅ Одобрить', callback_data: `verify_approve_${telegramIdBigInt}` },
                            { text: '❌ Отклонить', callback_data: `verify_reject_${telegramIdBigInt}` }
                        ],
                        [
                            { text: '💻 Открыть CRM', url: 'https://xn--c1acbe2apap.com/admin/drivers' }
                        ]
                    ]
                };

                for (const ad of admins) {
                    await bot.telegram.sendMessage(
                        Number(ad.telegramId),
                        adminMsg,
                        { parse_mode: 'HTML', protect_content: true, reply_markup: adminKeyboard }
                    ).catch(() => { });
                }
            } catch (adminErr) {
                console.error('Failed to notify admins of new registration:', adminErr);
            }
            return;
        }

    } catch (err) {
        console.error('State machine error:', err);
        ctx.reply('❌ Ошибка при обработке данных. Начните заново с команды /start');
        pendingRegistrations.delete(tgIdStr);
    }
});

// --- ADMIN DRIVER VERIFICATION HANDLERS (Inline Buttons) ---

bot.action(/^verify_approve_(\d+)$/, async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

    const driverTgId = BigInt(ctx.match[1]);
    try {
        const driver = await prisma.driver.update({
            where: { telegramId: driverTgId },
            data: { status: 'APPROVED' }
        });

        // Answer admin
        await ctx.answerCbQuery('Водитель одобрен!');
        await ctx.editMessageText(
            `✅ <b>Заявка одобрена!</b>\nВодитель: ${driver.fullFio || driver.firstName}\nТелефон: ${driver.phone}\nTelegram ID: ${driverTgId.toString()}`,
            { parse_mode: 'HTML' }
        );

        // Notify driver
        await bot.telegram.sendMessage(
            Number(driverTgId),
            '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nТеперь вам доступно рабочее меню водителя.',
            { parse_mode: 'HTML', ...getMainMenu(driverTgId.toString(), driver.role) }
        ).catch(() => { });
    } catch (e) {
        console.error(e);
        ctx.answerCbQuery('Ошибка. Возможно, пользователь уже удален.', { show_alert: true });
    }
});

bot.action(/^verify_reject_(\d+)$/, async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав', { show_alert: true });

    const driverTgId = BigInt(ctx.match[1]);
    try {
        const driver = await prisma.driver.update({
            where: { telegramId: driverTgId },
            data: { status: 'BANNED' }
        });

        await ctx.answerCbQuery('Заявка отклонена');
        await ctx.editMessageText(
            `❌ <b>Заявка отклонена!</b>\nВодитель: ${driver.fullFio || driver.firstName}\nТелефон: ${driver.phone}\nTelegram ID: ${driverTgId.toString()}`,
            { parse_mode: 'HTML' }
        );

        // Notify driver
        await bot.telegram.sendMessage(
            Number(driverTgId),
            '❌ <b>Ваша заявка на регистрацию отклонена администратором.</b>\nДоступ к системе закрыт.',
            { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
        ).catch(() => { });
    } catch (e) {
        console.error(e);
        ctx.answerCbQuery('Ошибка. Возможно, пользователь уже удален.', { show_alert: true });
    }
});

// --- ADMIN TEXT COMMANDS (`/approve`, `/reject`, `/ban`, `/unban`) ---

const findDriverByArg = async (arg: string) => {
    // If arg is pure digits, try Telegram ID first, then phone
    const cleanArg = arg.replace(/[^\d+]/g, '');
    let driver = null;

    if (/^\d+$/.test(cleanArg)) {
        try {
            driver = await prisma.driver.findUnique({ where: { telegramId: BigInt(cleanArg) } });
        } catch (e) { }
    }

    if (!driver && cleanArg) {
        // Try searching by phone (contains)
        const possibleDrivers = await prisma.driver.findMany({
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

bot.command('approve', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    const args = ctx.message.text.split(' ').slice(1).join(' ');
    if (!args) return ctx.reply('Использование: /approve <Telegram_ID или Телефон>');

    try {
        const driver = await findDriverByArg(args);
        if (!driver) return ctx.reply('Водитель не найден.');

        await prisma.driver.update({ where: { id: driver.id }, data: { status: 'APPROVED' } });
        ctx.reply(`✅ Водитель ${driver.fullFio || driver.firstName} одобрен!`);

        await bot.telegram.sendMessage(
            Number(driver.telegramId),
            '🎉 <b>Ваша заявка одобрена администратором!</b>',
            { parse_mode: 'HTML', ...getMainMenu(driver.telegramId.toString(), driver.role) }
        ).catch(() => { });
    } catch (e: any) {
        ctx.reply(e.message || 'Ошибка выполнения команды.');
    }
});

bot.command('reject', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    const parts = ctx.message.text.split(' ').slice(1);
    const arg = parts[0];
    const reason = parts.slice(1).join(' ');

    if (!arg) return ctx.reply('Использование: /reject <Telegram_ID или Телефон> [Причина]');

    try {
        const driver = await findDriverByArg(arg);
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
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    const parts = ctx.message.text.split(' ').slice(1);
    const arg = parts[0];
    const reason = parts.slice(1).join(' ');

    if (!arg) return ctx.reply('Использование: /ban <Telegram_ID или Телефон> [Причина]');

    try {
        const driver = await findDriverByArg(arg);
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
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    const args = ctx.message.text.split(' ').slice(1).join(' ');
    if (!args) return ctx.reply('Использование: /unban <Telegram_ID или Телефон>');

    try {
        const driver = await findDriverByArg(args);
        if (!driver) return ctx.reply('Водитель не найден.');

        await prisma.driver.update({ where: { id: driver.id }, data: { status: 'APPROVED' } });
        ctx.reply(`✅ Водитель ${driver.fullFio || driver.firstName} разбанен!`);

        await bot.telegram.sendMessage(
            Number(driver.telegramId),
            '🔄 <b>Администратор снял блокировку с вашего аккаунта!</b>',
            { parse_mode: 'HTML', ...getMainMenu(driver.telegramId.toString(), driver.role) }
        ).catch(() => { });
    } catch (e: any) {
        ctx.reply(e.message || 'Ошибка выполнения команды.');
    }
});

bot.command('add_driver', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    // Expected format: /add_driver <telegram_id> <FIO> [phone]
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
        return ctx.reply('Использование: /add_driver <Telegram_ID> <ФИО полностью> [Телефон]\nПример: /add_driver 123456789 Иванов Иван Иванович 89001234567');
    }

    const tgIdStr = args[0].replace(/[^\d]/g, '');
    if (!tgIdStr) return ctx.reply('Ошибка: Telegram_ID должен состоять только из цифр.');

    // Extract phone if the last argument looks like one (e.g., +7..., 89... with digits)
    let phone = '';
    let fioParts = args.slice(1);
    const lastArg = fioParts[fioParts.length - 1];
    if (/^[\d\+\-\(\)\s]{10,}$/.test(lastArg)) {
        phone = lastArg;
        fioParts.pop(); // Remove phone from FIO parts
    }
    const fio = fioParts.join(' ');

    try {
        const tgIdBig = BigInt(tgIdStr);

        // Check if user already exists
        let driver = await prisma.driver.findUnique({ where: { telegramId: tgIdBig } });

        if (driver) {
            // Update existing user
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
            // Create new user directly as APPROVED using upsert-like logic via create, since they might not have started the bot yet.
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

        // Try to notify the user. This might fail if the user has never started the bot (Telegram restriction).
        await bot.telegram.sendMessage(
            Number(tgIdBig),
            '🎉 <b>Ваша заявка одобрена администратором!</b>\n\nТеперь вам доступно рабочее меню водителя.',
            { parse_mode: 'HTML', ...getMainMenu(tgIdBig.toString(), driver.role) }
        ).catch((err) => {
            console.log("Could not notify added driver:", err.message);
            ctx.reply(`⚠️ Профиль создан, но отправить уведомление водителю не удалось. Возможно, он еще ни разу не нажимал /start в боте.`);
        });

    } catch (e: any) {
        ctx.reply(e.message || 'Ошибка выполнения команды. Проверьте правильность ID.');
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

bot.hears('⚙️ Настройки', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    // Only Main Admin can change global settings
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
    const { auth, role } = await checkAuth(ctx);
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
        ctx.reply('❌ Ошибка при получении статистики.', { protect_content: role !== 'ADMIN' });
    }
});

bot.hears('ℹ️ Справка', async (ctx) => {
    handleHelp(ctx);
});

bot.command('help', async (ctx) => {
    handleHelp(ctx);
});

const handleHelp = async (ctx: any) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth) return;

    let msg = `🤖 <b>Справка по боту GrandTransfer (v1.3.8)</b>\n\n`;
    msg += `<b>Основные функции (для водителей):</b>\n`;
    msg += `• <b>Получение рассылок:</b> Бот будет присылать уведомления о новых заказах с ограниченной информацией. Нажмите «✅ Забрать заявку», чтобы взять её и получить контакты клиента.\n`;
    msg += `• <b>🚗 Мои заказы:</b> Просмотр списка своих взятых заявок с контактами клиента и ссылкой на маршрут.\n`;
    msg += `• <b>💬 Чат:</b> Получение индивидуальной ссылки для вступления в закрытую группу водителей.\n`;
    msg += `• <b>📊 Статистика:</b> Просмотр общей выручки сервиса и заказов по тарифам.\n\n`;

    if (role === 'DISPATCHER' || role === 'ADMIN') {
        msg += `🎧 <b>Функции Диспетчера:</b>\n`;
        msg += `• <b>Прием заказов:</b> Новые заявки с сайта приходят вам с полными данными клиента (ФИО, телефон).\n`;
        msg += `• <b>👀 Активные заявки:</b> Просмотр списка всех заявок, их статусов (в поиске / взята) и исполнителей.\n`;
        msg += `• <b>🚗 Мои заявки:</b> Ваши взятые и курируемые заказы.\n`;
        msg += `• <b>📤 Отправить водителям:</b> Публикация заказа в общую ленту водителей без контактов.\n`;
        msg += `• <b>📄 Полная заявка:</b> Кнопка под активными заявками для управления и просмотра деталей.\n\n`;
    }

    if (role === 'ADMIN') {
        msg += `👑 <b>Дополнительные функции (Администратор):</b>\n`;
        msg += `• <b>Верификация:</b> Команды <code>/approve номер</code>, <code>/reject номер</code>, <code>/ban номер причина</code>, <code>/unban номер</code>.\n`;
        msg += `• <b>Добавление без проверки:</b> <code>/add_driver ID ФИО Телефон</code>.\n`;
        msg += `• <b>👥 Пользователи:</b> Поиск людей по ID/@username, одобрение/бан, выдача ролей администраторов, диспетчеров и просмотр чужих заказов.\n`;
        msg += `• <b>📢 Рассылка:</b> Команда <code>/send текст</code> отправляет важное сообщение всем пользователям.\n`;
        msg += `• <b>📥 Выгрузить EXCEL:</b> Скачивание всей базы заявок CSV файлом.\n`;
        msg += `• <b>🗑 Очистить БД:</b> Полное удаление всех заявок.\n`;
        msg += `• <b>🌐 Панель на сайте:</b> Получение ссылки на админ панель и CRM систему.\n\n`;
    }

    msg += `📌 <b>Обновление v1.3.8 (${new Date().toLocaleDateString('ru-RU')}):</b>\n`;
    msg += `- 💻 **CRM Панель**: Добавлена кнопка авторизации для администраторов прямо на стартовый экран.\n`;
    msg += `- 🧹 **Очистка чата**: Добавлена команда /clear для удаления предыдущих сообщений.\n`;
    msg += `\n📌 <b>Обновление v1.3.7:</b>\n`;
    msg += `- 📝 **Верификация**: Многошаговая регистрация (ФИО, ПТС, СТС, Авто) через бота.\n`;
    msg += `- 👨‍💻 **Медиа в CRM**: Изображения ПТС и СТС водителей открываются из веб-панели.\n`;
    msg += `\n📌 <b>Обновление v1.3.5:</b>\n`;
    msg += `- 🏁 **Выполнение**: Возможность закрывать взятые заказы кнопкой "Заявка выполнена".\n`;
    msg += `\n<i>⚠️ Для обновления кнопок меню внизу напишите боту команду /start</i>\n`;

    ctx.replyWithHTML(msg, { protect_content: role !== 'ADMIN' });
};

// Clear chat command
bot.command('clear', async (ctx) => {
    try {
        const messageId = ctx.message.message_id;
        let deletedCount = 0;
        // Try to delete the last 50 messages to "clear" the chat visually
        for (let i = 0; i < 50; i++) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, messageId - i);
                deletedCount++;
            } catch (e) {
                // Ignore errors for already deleted or non-existent messages
                if (deletedCount > 5) break; // Break early if we hit a streak of non-existent messages
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

bot.command('version', async (ctx) => {
    ctx.reply('Версия бота: v1.3.8\nПоследнее обновление: Кнопка CRM на старте и команда /clear.');
});

bot.hears(['🚗 Мои заказы', '🚗 Мои заявки'], async (ctx) => {
    const { auth, dbId, role } = await checkAuth(ctx);
    if (!auth || !dbId) return;

    try {
        // Dispatchers should see orders where they are the driver (TAKEN) OR the dispatcher (DISPATCHED/PROCESSING)
        const whereClause = role === 'DISPATCHER' ? {
            OR: [
                { dispatcherId: dbId },
                { driverId: dbId, status: 'TAKEN' }
            ]
        } : { driverId: dbId, status: 'TAKEN' };

        const myOrders = await prisma.order.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { driver: true, dispatcher: true }
        });

        if (myOrders.length === 0) {
            return ctx.reply('У вас пока нет активных взятых или курируемых заявок.', { protect_content: true });
        }

        await ctx.reply('🚗 <b>Ваши активные заявки:</b>', { parse_mode: 'HTML' });

        let protectContentGlobal = true;
        try {
            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (settings) {
                protectContentGlobal = settings.protectContent;
            }
        } catch (e) {
            console.warn("Could not query BotSettings", e);
        }

        for (const o of myOrders) {
            const msg = formatOrderMessage(o, role);

            const buttons = [];
            // Driver can complete order if they are taking it
            if (o.status === 'TAKEN' && o.driverId === dbId) {
                buttons.push([{ text: '✅ Заявка выполнена', callback_data: `complete_order_${o.id}` }]);
            }

            await ctx.replyWithHTML(msg, {
                protect_content: role === 'ADMIN' ? false : protectContentGlobal,
                reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined
            });
        }
    } catch (err) {
        ctx.reply('❌ Ошибка при получении ваших заказов.', { protect_content: true });
    }
});

bot.hears('📚 История заявок', async (ctx) => {
    const { auth, dbId, role } = await checkAuth(ctx);
    if (!auth || !dbId) return;

    try {
        // Dispatchers see orders where they were dispatcher or driver, Drivers see only where they were driver
        const whereClause = role === 'DISPATCHER' ? {
            OR: [
                { dispatcherId: dbId },
                { driverId: dbId, status: { in: ['COMPLETED', 'CANCELLED'] } }
            ]
        } : { driverId: dbId, status: { in: ['COMPLETED', 'CANCELLED'] } };

        const historyOrders = await prisma.order.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { driver: true, dispatcher: true }
        });

        // Filter for dispatchers in memory to only show COMPLETED or CANCELLED,
        // because we also want to show if they were the dispatcher and it got cancelled/completed.
        // Or we can just add the status filter cleanly in the OR clause above. Wait, if we edit the OR above:
        // status: { in: ['COMPLETED', 'CANCELLED'] } applies to BOTH conditions if we put it outside the OR.

        const finalOrders = historyOrders.filter((o: any) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

        if (finalOrders.length === 0) {
            return ctx.reply('У вас пока нет завершенных или отмененных заявок.', { protect_content: true });
        }

        await ctx.reply('📚 <b>История ваших заявок (последние 20):</b>', { parse_mode: 'HTML' });

        for (const o of finalOrders) {
            const msg = formatOrderMessage(o, role);

            await ctx.replyWithHTML(msg, {
                protect_content: role !== 'ADMIN'
            });
        }
    } catch (err) {
        ctx.reply('❌ Ошибка при получении истории.', { protect_content: true });
    }
});

bot.hears('👀 Активные заявки', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return;

    try {
        const activeOrders = await prisma.order.findMany({
            where: { status: { in: ['TAKEN', 'NEW', 'DISPATCHED', 'PROCESSING'] } },
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
        const inlineButtons: any[] = [];

        activeOrders.forEach((o: any) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ru-RU') : '';
            const driverName = o.driverId ? driverMap.get(o.driverId) || 'Неизвестен' : 'Неизвестен';

            let statusEmoji = o.status === 'NEW' ? '🔵' : (o.status === 'DISPATCHED' ? '🟡' : (o.status === 'PROCESSING' ? '🟣' : '🟢'));
            let driverInfo = '';

            if (o.status === 'TAKEN') {
                driverInfo = `\n👨‍✈️ <b>Исполнитель (Водитель):</b> ${driverName}`;
            } else if (o.status === 'PROCESSING') {
                driverInfo = `\n🎧 <b>Исполнитель (Диспетчер):</b> ${o.dispatcherId ? (driverMap.get(o.dispatcherId) || 'Неизвестен') : 'Неизвестен'}`;
            } else {
                driverInfo = `\n📌 <b>Статус:</b> В поиске`;
            }

            msg += `${statusEmoji} <b>Заявка № ${o.id}</b> (${dateStr})\n` +
                `📍 <b>Маршрут:</b> ${o.fromCity} — ${o.toCity}\n` +
                `💰 <b>Сумма:</b> ${o.priceEstimate ? o.priceEstimate + ' ₽' : 'Не рассчитана'}` +
                `${driverInfo}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n`;

            inlineButtons.push(Markup.button.callback(`📄 Заявка № ${o.id}`, `full_order_${o.id}`));
        });

        const keyboardRows = [];
        for (let i = 0; i < inlineButtons.length; i += 2) {
            keyboardRows.push(inlineButtons.slice(i, i + 2));
        }

        let protectContentGlobal = true;
        try {
            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (settings) {
                protectContentGlobal = settings.protectContent;
            }
        } catch (e) {
            console.warn("Could not query BotSettings", e);
        }

        ctx.replyWithHTML(msg, {
            protect_content: role === 'ADMIN' ? false : protectContentGlobal,
            reply_markup: { inline_keyboard: keyboardRows }
        });
    } catch (err: any) {
        ctx.reply(`❌ Ошибка при получении активных заявок.\nТех. информация: ${err.message}`, { protect_content: true });
    }
});

bot.hears('✅ Выполненные заявки', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;

    try {
        const completedOrders = await prisma.order.findMany({
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { driver: true, dispatcher: true }
        });

        if (completedOrders.length === 0) {
            return ctx.reply('Нет выполненных заявок.', { protect_content: true });
        }

        await ctx.reply('✅ <b>Последние 20 выполненных заявок:</b>', { parse_mode: 'HTML' });

        for (const o of completedOrders) {
            const msg = formatOrderMessage(o, role);

            await ctx.replyWithHTML(msg, {
                protect_content: false
            });
        }
    } catch (err) {
        ctx.reply('❌ Ошибка при получении заявок.', { protect_content: true });
    }
});

bot.action(/^full_order_(\d+)$/, async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return ctx.answerCbQuery('Заявка не найдена', { show_alert: true });

        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : '';
        const pt1 = encodeURIComponent(order.fromCity);
        const pt2 = encodeURIComponent(order.toCity);
        const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

        const msg = `
📋 <b>ПОЛНАЯ ЗАЯВКА № ${order.id}</b>
<i>(Создана ${dateStr})</i>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.customerPhone}
📌 <b>Текущий Статус:</b> ${translateStatus(order.status, role)}
        `.trim();

        const keyboardButtons: any[] = [];
        if (order.status === 'NEW' || order.status === 'PROCESSING') {
            keyboardButtons.push([{ text: '🎧 Взять в работу', callback_data: `take_work_${order.id}` }]);
            keyboardButtons.push([{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${order.id}` }]);
        } else if (order.status === 'TAKEN' || order.status === 'PROCESSING') {
            keyboardButtons.push([{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }]);
        }
        keyboardButtons.push([{ text: '🗺 Открыть маршрут', url: mapLink }]);

        let protectContentGlobal = true;
        try {
            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (settings) {
                protectContentGlobal = settings.protectContent;
            }
        } catch (e) {
            console.warn("Could not query BotSettings", e);
        }

        await ctx.replyWithHTML(msg, {
            reply_markup: { inline_keyboard: keyboardButtons },
            protect_content: role === 'ADMIN' ? false : protectContentGlobal
        });
        await ctx.answerCbQuery();
    } catch (err) {
        ctx.answerCbQuery('Ошибка получения заявки');
    }
});

// Admin commands
bot.hears('💬 Чат', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
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

bot.hears('💻 CRM Система', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    ctx.reply('Панель управления доступна по ссылке: https://xn--c1acbe2apap.com/admin/drivers', { protect_content: true });
});

bot.hears('🌐 Панель на сайте', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    ctx.reply('Панель управления доступна по ссылке: https://xn--c1acbe2apap.com/admin/drivers', { protect_content: true });
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

import * as xlsx from 'xlsx';

bot.hears('📥 Выгрузить EXCEL', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return;
    try {
        await ctx.reply('⏳ Формирую отчеты, подождите...');

        // 1. ORDERS BY MONTH SHEETS
        const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
        const drivers = await prisma.driver.findMany();
        const driverMap = new Map();
        drivers.forEach((d: any) => {
            const name = d.username ? `@${d.username}` : (d.firstName || `ID: ${d.telegramId}`);
            driverMap.set(d.id, name);
        });

        const ordersByMonth = new Map<string, any[][]>();
        const headers = ["ID", "Дата", "Откуда", "Куда", "Тариф", "Пассажиров", "Сумма", "Имя Клиента", "Телефон", "Комментарий", "Исполнитель", "Статус"];

        orders.forEach((o: any) => {
            const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
            let monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '').trim();

            if (!ordersByMonth.has(monthName)) {
                ordersByMonth.set(monthName, [[...headers]]);
            }

            const dateStr = dateObj.toLocaleString('ru-RU');
            const driverStr = o.driverId ? (driverMap.get(o.driverId) || o.driverId) : (o.dispatcherId ? (driverMap.get(o.dispatcherId) + ' (Диспетчер)') : '');

            ordersByMonth.get(monthName)!.push([
                o.id.toString(), dateStr, o.fromCity, o.toCity, translateTariff(o.tariff),
                o.passengers.toString(), o.priceEstimate ? o.priceEstimate.toString() : '',
                o.customerName, o.customerPhone, o.comments || '', driverStr, translateStatus(o.status)
            ]);
        });

        // 2. DRIVERS SHEET
        const driversData = [
            ["ID (БД)", "TG ID", "Юзернейм", "Имя", "Телефон", "ПТС", "Роль", "Статус", "ФотоПрав_ФайлID", "ФотоАвто_ФайлID", "Дата регистрации"]
        ];

        drivers.forEach((d: any) => {
            const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleString('ru-RU') : '';
            driversData.push([
                d.id, d.telegramId.toString(), d.username || '', d.firstName || '',
                d.phone || '', d.ptsNumber || '', d.role, d.status,
                d.licensePhotoId || '', d.carPhotoId || '', dateStr
            ]);
        });

        // 3. CLIENTS SHEET (Aggregated from Orders)
        const clientsMap = new Map();
        orders.forEach((o: any) => {
            if (!o.customerPhone) return;
            const key = o.customerPhone;
            if (!clientsMap.has(key)) {
                clientsMap.set(key, { name: o.customerName, phone: o.customerPhone, ordersCount: 0, totalSpent: 0, lastOrder: o.createdAt });
            }
            const client = clientsMap.get(key);
            client.ordersCount++;
            if (o.priceEstimate && o.status === 'COMPLETED') {
                client.totalSpent += o.priceEstimate;
            }
            if (new Date(o.createdAt) > new Date(client.lastOrder)) {
                client.lastOrder = o.createdAt;
            }
        });

        const clientsData = [
            ["Имя", "Телефон", "Кол-во заказов", "Сумма (Выполненные)", "Последний заказ"]
        ];

        Array.from(clientsMap.values()).forEach((c: any) => {
            const dateStr = c.lastOrder ? new Date(c.lastOrder).toLocaleString('ru-RU') : '';
            clientsData.push([
                c.name, c.phone, c.ordersCount.toString(), c.totalSpent.toString(), dateStr
            ]);
        });

        // Create Workook
        const wb = xlsx.utils.book_new();

        // Add Orders by Month
        let hasOrders = false;
        for (const [monthName, data] of ordersByMonth.entries()) {
            const ws = xlsx.utils.aoa_to_sheet(data);
            // Safe sheet name length is 31 characters
            let sheetName = monthName.substring(0, 31);
            xlsx.utils.book_append_sheet(wb, ws, sheetName);
            hasOrders = true;
        }

        // Add fallback if DB is completely empty for orders
        if (!hasOrders) {
            const wsOrders = xlsx.utils.aoa_to_sheet([headers]);
            xlsx.utils.book_append_sheet(wb, wsOrders, "Заказы (пусто)");
        }

        const wsDrivers = xlsx.utils.aoa_to_sheet(driversData);
        // Replace / \ ? * : [ ] with empty spaces for valid sheet name
        xlsx.utils.book_append_sheet(wb, wsDrivers, "Водители и Админы");

        const wsClients = xlsx.utils.aoa_to_sheet(clientsData);
        xlsx.utils.book_append_sheet(wb, wsClients, "Клиенты");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        await ctx.replyWithDocument(
            { source: buffer, filename: `grand_transfer_db_${new Date().toISOString().split('T')[0]}.xlsx` },
            { caption: '📄 Полная выгрузка базы данных (Заказы, Водители, Клиенты)', protect_content: true }
        );
    } catch (e) {
        console.error("Export Error:", e);
        ctx.reply('❌ Ошибка экспорта EXCEL.', { protect_content: true });
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
                buttons.push(Markup.button.callback('✅ Принять (Водитель)', `approve_${d.telegramId}`));
                buttons.push(Markup.button.callback('🎧 Принять (Диспетчер)', `approve_disp_${d.telegramId}`));
            }
            if (d.status !== 'BANNED') {
                buttons.push(Markup.button.callback('🚫 Забанить', `ban_${d.telegramId}`));
            }
            buttons.push(Markup.button.callback('🗑 Выгнать', `delete_${d.telegramId}`));

            // Only Main Admin can assign ADMIN roles or demote Admins
            if (ctx.chat?.id.toString() === adminId) {
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
                // Other Admins can at least assign Dispachers, but not Admins, and cannot touch other Admins
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

    await ctx.reply('Введите Telegram ID или @username пользователя для поиска:', {
        reply_markup: { force_reply: true },
        protect_content: false
    });
    await ctx.answerCbQuery();
});

// Listen for the text reply containing the ID or username
bot.on('text', async (ctx, next) => {
    const replyToMsg = ctx.message.reply_to_message as any;
    if (replyToMsg && replyToMsg.text && replyToMsg.text.includes('Введите Telegram ID или @username')) {
        const { auth, role } = await checkAuth(ctx);
        if (!auth || role !== 'ADMIN') return;

        let searchStr = ctx.message.text.trim();
        let d = null;

        try {
            // Check if it's an ID
            if (/^\d+$/.test(searchStr)) {
                d = await prisma.driver.findUnique({ where: { telegramId: BigInt(searchStr) } });
            } else {
                // Otherwise treat as username
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

            const buttons = [];
            if (d.status === 'PENDING') {
                buttons.push(Markup.button.callback('✅ Принять (Водитель)', `approve_${d.telegramId}`));
                buttons.push(Markup.button.callback('🎧 Принять (Диспетчер)', `approve_disp_${d.telegramId}`));
            }
            if (d.status !== 'BANNED') {
                buttons.push(Markup.button.callback('🚫 Забанить', `ban_${d.telegramId}`));
            }
            buttons.push(Markup.button.callback('🗑 Выгнать', `delete_${d.telegramId}`));
            // Only Main Admin can assign ADMIN roles or demote Admins
            if (ctx.chat?.id.toString() === adminId) {
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
                // Other Admins can at least assign Dispachers, but not Admins, and cannot touch other Admins
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

bot.action(/^approve_(\d+)$/, async (ctx) => {
    const telegramId = BigInt(ctx.match[1]);
    try {
        const updatedDriver = await prisma.driver.update({ where: { telegramId }, data: { status: 'APPROVED', role: 'DRIVER' } });
        await ctx.answerCbQuery('Одобрен как Водитель');
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n✅ ОДОБРЕН КАК ВОДИТЕЛЬ');
        try {
            await bot.telegram.sendMessage(Number(telegramId), '✅ Ваша заявка одобрена! Теперь вам доступно меню водителя.', { ...getMainMenu(telegramId.toString(), updatedDriver.role), protect_content: true });
        } catch (e) { }
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
            await bot.telegram.sendMessage(Number(telegramId), '✅ Ваша заявка одобрена! Теперь вам доступно меню диспетчера.', { ...getMainMenu(telegramId.toString(), updatedDriver.role), protect_content: true });
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

bot.action(/^delete_(\d+)$/, async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    if (!auth || role !== 'ADMIN') return ctx.answerCbQuery('Нет прав');

    const telegramId = BigInt(ctx.match[1]);
    try {
        await prisma.driver.delete({ where: { telegramId } });
        await ctx.answerCbQuery('Пользователь удален из базы');
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\n🗑 ПОЛЬЗОВАТЕЛЬ УДАЛЕН');
    } catch {
        await ctx.answerCbQuery('Ошибка удаления. Возможно, за ним числятся заказы.');
    }
});

bot.action(/^setrole_(\d+)_([A-Z]+)$/, async (ctx) => {
    const telegramId = BigInt(ctx.match[1]);
    const newRole = ctx.match[2];
    try {
        await prisma.driver.update({ where: { telegramId }, data: { role: newRole } });
        await ctx.answerCbQuery(`Роль изменена на ${newRole}`);
        await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + `\n\n👑 РОЛЬ ИЗМЕНЕНА НА: ${newRole}`);
        try {
            await bot.telegram.sendMessage(Number(telegramId), `Вам присвоена роль: ${newRole}! Меню обновлено.`, { ...getMainMenu(telegramId.toString(), newRole), protect_content: true });
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

// Dispatch Order Action (For Admins and Dispatchers)
bot.action(/^dispatch_order_(\d+)$/, async (ctx) => {
    const { auth, role, dbId } = await checkAuth(ctx);
    if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) {
        return ctx.answerCbQuery('У вас нет прав для отправки заявки водителям.', { show_alert: true });
    }

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
        }

        if (order.status !== 'NEW' && order.status !== 'PROCESSING') {
            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            await ctx.editMessageText(txt + '\n\n❌ <i>Эта заявка уже обработана или взята водителем.</i>', { parse_mode: 'HTML' });
            return ctx.answerCbQuery('Уже обработано!', { show_alert: true });
        }

        // Lock the order as DISPATCHED
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'DISPATCHED', dispatcherId: dbId }
        });

        const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
        const dispatcherInfo = `\n\n✅ <b>ВЫ ОТПРАВИЛИ ЭТУ ЗАЯВКУ ВОДИТЕЛЯМ</b>`;
        await ctx.editMessageText(txt + dispatcherInfo, { parse_mode: 'HTML' });
        await ctx.answerCbQuery('Заявка отправлена водителям!', { show_alert: true });

        // Build the restricted message for Drivers (No Name, No Phone)
        const fromCityObj = cities.find(c => c.name.toLowerCase() === order.fromCity.toLowerCase());
        const toCityObj = cities.find(c => c.name.toLowerCase() === order.toCity.toLowerCase());
        const pt1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(order.fromCity);
        const pt2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(order.toCity);
        const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

        const driverMessage = `
🚕 <b>Новый заказ для водителей!</b>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
<i>(Остальные контакты будут доступны после принятия заявки)</i>

<i>№ заказа: ${order.id}</i>
        `.trim();

        const keyboard = {
            inline_keyboard: [
                [{ text: '✅ Забрать заявку', callback_data: `take_order_${order.id}` }],
                [{ text: '🗺 Открыть маршрут', url: mapLink }]
            ]
        };

        let protectContentGlobal = true;
        try {
            const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
            if (settings) {
                protectContentGlobal = settings.protectContent;
            }
        } catch (e) { }

        // Find all approved DRIVERS and send it
        const drivers = await prisma.driver.findMany({
            where: { status: 'APPROVED', role: { in: ['DRIVER', 'ADMIN'] } }
            // Send to admins as well so they can test/see what drivers see
        });

        for (const drv of drivers) {
            try {
                // If it's an admin, we don't protect it so they can easily manage. 
                // If it's a driver, we follow global protect_content settings.
                const shouldProtect = drv.role === 'ADMIN' ? false : protectContentGlobal;

                const sentMsg = await bot.telegram.sendMessage(
                    Number(drv.telegramId),
                    driverMessage,
                    { parse_mode: 'HTML', reply_markup: keyboard, protect_content: shouldProtect }
                );

                // Track driver message so we can delete it when someone takes it
                await prisma.broadcastMessage.create({
                    data: {
                        orderId: order.id,
                        telegramId: BigInt(drv.telegramId),
                        messageId: sentMsg.message_id
                    }
                });
            } catch (err) {
                console.error(`Failed to send driver dispatch to ${drv.telegramId}:`, err);
            }
        }

    } catch (err) {
        console.error('Dispatch error:', err);
        ctx.answerCbQuery('Произошла ошибка базы данных.');
    }
});

// Take into Work Action (For Dispatchers and Admins)
bot.action(/^take_work_(\d+)$/, async (ctx) => {
    const { auth, role, dbId } = await checkAuth(ctx);
    if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) {
        return ctx.answerCbQuery('У вас нет прав для взятия заявки диспетчером.', { show_alert: true });
    }

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return ctx.answerCbQuery('Заявка не найдена в базе.', { show_alert: true });
        }

        if (order.status !== 'NEW') {
            return ctx.answerCbQuery('Заявка уже в работе или отправлена водителям!', { show_alert: true });
        }

        // Update status to PROCESSING (meaning a dispatcher is working on it but it's not dispatched yet)
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PROCESSING', dispatcherId: dbId, takenAt: new Date() }
        });

        const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

        // Update all dispatcher/admin notification messages
        try {
            const bms = await prisma.broadcastMessage.findMany({ where: { orderId } });

            for (const bm of bms) {
                try {
                    const isSelf = ctx.chat && bm.telegramId === BigInt(ctx.chat.id);
                    // Fetch original text (we just append status and change keyboard)
                    // Note: Telegraf doesn't have an easy way to GET message text, so we assume standard text and just overwrite reply markup
                    // Or we just send a new text to replace it - simplest approach is to construct it again or append

                    const fromCityObj = cities.find(c => c.name.toLowerCase() === order.fromCity.toLowerCase());
                    const toCityObj = cities.find(c => c.name.toLowerCase() === order.toCity.toLowerCase());
                    const pt1 = fromCityObj ? `${fromCityObj.lat},${fromCityObj.lon}` : encodeURIComponent(order.fromCity);
                    const pt2 = toCityObj ? `${toCityObj.lat},${toCityObj.lon}` : encodeURIComponent(order.toCity);
                    const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${pt1}~${pt2}`;

                    if (isSelf) {
                        const newText = `
🚨 <b>Новая заявка на трансфер!</b>

📍 <b>Откуда:</b> ${order.fromCity}
🏁 <b>Куда:</b> ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Расчетная стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}

📝 <b>Комментарий:</b> ${order.comments || 'Нет'}

<i>№ заказа: ${order.id}</i>

🎧 <b>Взял в работу:</b> ${takerName}
`.trim();

                        const newKeyboard = {
                            inline_keyboard: [
                                [{ text: '📋 Полная заявка', callback_data: `full_order_${order.id}` }],
                                [{ text: '📤 Отправить водителям', callback_data: `dispatch_order_${order.id}` }],
                                [{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }],
                                [{ text: '🗺 Открыть Яндекс Карты', url: mapLink }]
                            ]
                        };

                        await bot.telegram.editMessageText(
                            Number(bm.telegramId),
                            bm.messageId,
                            undefined,
                            newText,
                            { parse_mode: 'HTML', reply_markup: newKeyboard }
                        );
                    } else {
                        // Delete the message for all other dispatchers/admins
                        await bot.telegram.deleteMessage(Number(bm.telegramId), bm.messageId);
                    }
                } catch (editErr) {
                    console.error(`Failed to update or delete msg for ${bm.telegramId}:`, editErr);
                }
            }
        } catch (dbErr) {
            console.error('Failed to get broadcast messages:', dbErr);
        }

        await ctx.answerCbQuery('Вы взяли заявку в работу!', { show_alert: true });

    } catch (err) {
        console.error('Take work error:', err);
        ctx.answerCbQuery('Произошла ошибка при взятии в работу.');
    }
});

// View Full Order (For Dispatchers holding the order)
bot.action(/^full_order_(\d+)$/, async (ctx) => {
    const { auth, role, dbId } = await checkAuth(ctx);
    if (!auth || !dbId || (role !== 'ADMIN' && role !== 'DISPATCHER')) return ctx.answerCbQuery('Нет прав');

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return ctx.answerCbQuery('Заявка не найдена');

        const msg = `
📋 <b>Полная информация по заявке № ${order.id}</b>

📍 <b>Маршрут:</b> ${order.fromCity} — ${order.toCity}
🚕 <b>Тариф:</b> ${translateTariff(order.tariff)}
👥 <b>Пассажиров:</b> ${order.passengers}
💰 <b>Стоимость:</b> ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Не рассчитана'}
📝 <b>Комментарий:</b> ${order.comments || 'Нет'}
🗺 <a href="https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${encodeURIComponent(order.fromCity)}~${encodeURIComponent(order.toCity)}">📍 Открыть маршрут в Яндекс Картах</a>

👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.customerPhone}
`.trim();

        await ctx.replyWithHTML(msg, { protect_content: true });
        await ctx.answerCbQuery();
    } catch (e) {
        ctx.answerCbQuery('Ошибка получения данных');
    }
});

// Take Order Action (For Drivers)
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

        if (order.status !== 'DISPATCHED' && order.status !== 'NEW') {
            // Order is already taken or completed
            const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
            await ctx.editMessageText(txt + '\n\n❌ <i>Заявка уже взята в работу другим водителем.</i>', { parse_mode: 'HTML' });
            return ctx.answerCbQuery('Заявка уже взята!', { show_alert: true });
        }

        // Lock the order
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'TAKEN', driverId: dbId, takenAt: new Date() }
        });

        const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";

        // Provide full info to the driver via editing the notification
        const customerInfo = `\n\n✅ <b>ВЫ ВЗЯЛИ ЭТУ ЗАЯВКУ В РАБОТУ</b>\n\n👤 <b>Клиент:</b> ${order.customerName}\n📞 <b>Телефон:</b> ${order.customerPhone}\n\n<i>Для завершения заказа нажмите кнопку ниже:</i>`;

        await ctx.editMessageText(txt + customerInfo, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🏁 Заявка выполнена', callback_data: `complete_order_${order.id}` }]
                ]
            }
        });
        await ctx.answerCbQuery('Вы успешно взяли заявку!', { show_alert: true });

        // Retrieve and delete messages for other drivers/admins
        try {
            const bms = await prisma.broadcastMessage.findMany({ where: { orderId } });
            const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

            // Notify dispatcher and global admins
            const staffToNotify = await prisma.driver.findMany({
                where: {
                    status: 'APPROVED',
                    role: { in: ['ADMIN', 'DISPATCHER'] }
                }
            });

            const notifyPromises = staffToNotify.map(async (staff: any) => {
                // If the staff member is the one who just took the driver order, skip
                if (staff.telegramId === BigInt(ctx.chat?.id || 0)) return;

                const adminTxt = `🚨 <b>Заявка № ${orderId} ВЗЯТА В РАБОТУ</b>\n\n👨‍✈️ Водитель: <b>${takerName}</b>\n📍 Маршрут: ${order.fromCity} — ${order.toCity}\n💰 ${order.priceEstimate ? order.priceEstimate + ' ₽' : 'Без оценки'}`;
                return bot.telegram.sendMessage(Number(staff.telegramId), adminTxt, { parse_mode: 'HTML' }).catch(() => { });
            });
            await Promise.all(notifyPromises);

            for (const bm of bms) {
                // Do not delete for the driver who took the order (their message was edited above)
                if (ctx.chat && bm.telegramId === BigInt(ctx.chat.id)) continue;

                // Strip the "take order" button for everyone else by deleting the message
                // This cleans up the chat for drivers who didn't take it
                try {
                    await bot.telegram.deleteMessage(Number(bm.telegramId), bm.messageId);
                } catch (delErr) {
                    console.error(`Failed to delete message for ${bm.telegramId}:`, delErr);
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

// Complete Order Action
bot.action(/^complete_order_(\d+)$/, async (ctx) => {
    const { auth, role, dbId } = await checkAuth(ctx);
    if (!auth || !dbId) return ctx.answerCbQuery('Нет прав', { show_alert: true });

    const orderId = parseInt(ctx.match[1], 10);
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return ctx.answerCbQuery('Заявка не найдена', { show_alert: true });

        if (order.status !== 'TAKEN' && order.status !== 'PROCESSING') {
            return ctx.answerCbQuery('Заявка не находится в работе!', { show_alert: true });
        }

        const isAssignedDriver = order.driverId === dbId;
        const isAssignedDispatcher = order.dispatcherId === dbId;

        if (!isAssignedDriver && !isAssignedDispatcher && role !== 'ADMIN') {
            return ctx.answerCbQuery('Только назначенный исполнитель может завершить заявку.', { show_alert: true });
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'COMPLETED', completedAt: new Date() }
        });

        const txt = (ctx.callbackQuery.message as any)?.text || "Заявка";
        const cleanTxt = txt.replace(/Для завершения заказа нажмите кнопку ниже:/i, '').trim();

        await ctx.editMessageText(cleanTxt + '\n\n✅ <b>ЗАЯВКА УСПЕШНО ВЫПОЛНЕНА</b>', { parse_mode: 'HTML', reply_markup: undefined });
        await ctx.answerCbQuery('Заявка выполнена!', { show_alert: true });

        const takerName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || 'Неизвестно');

        if (order.dispatcherId && !isAssignedDispatcher) {
            const disp = await prisma.driver.findUnique({ where: { id: order.dispatcherId } });
            if (disp && disp.telegramId !== BigInt(ctx.chat?.id || 0)) {
                const dispMsg = `✅ <b>Заявка № ${order.id} ВЫПОЛНЕНА</b>\n\nИсполнитель: <b>${takerName}</b>\nМаршрут: ${order.fromCity} — ${order.toCity}`;
                await bot.telegram.sendMessage(Number(disp.telegramId), dispMsg, { parse_mode: 'HTML' }).catch(() => { });
            }
        }

        const admins = await prisma.driver.findMany({ where: { status: 'APPROVED', role: 'ADMIN' } });
        for (const admin of admins) {
            if (admin.id !== order.dispatcherId && admin.telegramId !== BigInt(ctx.chat?.id || 0)) {
                const adminMsg = `✅ <b>Заявка № ${order.id} ЗАКРЫТА</b>\n\nЗакрыл(а): <b>${takerName}</b>\nМаршрут: ${order.fromCity} — ${order.toCity}`;
                await bot.telegram.sendMessage(Number(admin.telegramId), adminMsg, { parse_mode: 'HTML' }).catch(() => { });
            }
        }

    } catch (err) {
        console.error('Complete_order error:', err);
        ctx.answerCbQuery('Произошла ошибка при завершении заявки.');
    }
});

// Moderation Settings
const BANNED_WORDS = ['хуй', 'пизда', 'ебать', 'сука', 'блядь', 'блять', 'пидор', 'гандон', 'шлюха'];
const POLITICAL_WORDS = ['путин', 'зеленский', 'навальный', 'байден', 'сво', 'война', 'украина', 'россия', 'политика', 'митинг', 'выборы'];
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)|(t\.me\/[^\s]+)/gi;

// Chat Group Moderation Listener
bot.on('message', async (ctx, next) => {
    // Only moderate messages in group chats (supergroups or regular groups)
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {

        // 1. System messages cleanup (Join/Leave/Pin)
        if ('new_chat_members' in ctx.message || 'left_chat_member' in ctx.message || 'pinned_message' in ctx.message) {
            try {
                await ctx.deleteMessage();
            } catch (err) { }
            return; // Stop processing this message
        }

        const messageText = (ctx.message as any)?.text || (ctx.message as any)?.caption || '';

        if (!messageText) return next();

        const lowerText = messageText.toLowerCase();
        let shouldDelete = false;
        let reason = '';

        // 1. Check for URLs / Links
        if (URL_REGEX.test(messageText)) {
            shouldDelete = true;
            reason = 'Ссылки запрещены';
        }

        // 2. Check for Profanity
        if (!shouldDelete && BANNED_WORDS.some(word => lowerText.includes(word))) {
            shouldDelete = true;
            reason = 'Ненормативная лексика';
        }

        // 3. Check for Political keywords
        if (!shouldDelete && POLITICAL_WORDS.some(word => lowerText.includes(word))) {
            shouldDelete = true;
            reason = 'Политические обсуждения правилами запрещены';
        }

        if (shouldDelete) {
            try {
                await ctx.deleteMessage();
                // Optionally warn the user silently or briefly
                const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, ваше сообщение удалено. Причина: ${reason}.`);
                // Delete the warning after 5 seconds to keep the chat clean
                setTimeout(() => {
                    ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => { });
                }, 5000);
            } catch (err) {
                console.error('Failed to moderate / delete message:', err);
            }
            // Stop processing this message further
            return;
        }
    }

    // Continue processing if no violation or not a group chat
    return next();
});

// Generate Group Invite Link (Main Admins Only for direct usage, though everyone gets one via Chat button)
bot.command('invite', async (ctx) => {
    const { auth, role } = await checkAuth(ctx);
    // Only the owner can manually generate open-ended links
    if (!auth || ctx.chat.id.toString() !== adminId) return;

    // The chat ID of the group must be provided, or bot needs to know it.
    const groupId = process.env.TELEGRAM_GROUP_ID || '-1003744157897';

    if (!groupId) {
        return ctx.reply('⚠️ ID группы не настроен (TELEGRAM_GROUP_ID). Добавьте бота в группу и выдайте ему права администратора, затем я смогу генерировать ссылки.', { protect_content: true });
    }

    try {
        // Generate a link that expires in 1 day and allows 1 use
        const expireDate = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
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

// Bot version command
bot.command('version', (ctx) => {
    const versionMsg = `
🤖 **Grand Transfer Bot**
Версия: \`v1.3.9\`
Обновлено: Февраль 2026

**Что нового (1.3.9):**
- Часовые пояса привязаны к МСК
- Добавлен хронометраж \`Взята: \` и \`Завершена: \` для заказов
- Прямые ссылки-переходы (\`?orderId=\`) из таблицы CRM
- Исправлено дублирование @ в профиле и перевод тарифа Standart
- Множественные улучшения UX Web-CRM
`;
    ctx.reply(versionMsg, { parse_mode: 'Markdown' });
});

let isShuttingDown = false;

async function startBot() {
    while (!isShuttingDown) {
        try {
            console.log('🤖 Telegram bot is starting...');
            // Force delete any existing webhook so long-polling works reliably
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            await bot.launch({ dropPendingUpdates: true });
            console.log('🤖 Telegram bot stopped normally. Waiting 10s before restart to prevent Docker loop...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.error('Bot crashed, restarting in 5s...', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startBot();

process.once('SIGINT', () => { isShuttingDown = true; bot.stop('SIGINT'); });
process.once('SIGTERM', () => { isShuttingDown = true; bot.stop('SIGTERM'); });
