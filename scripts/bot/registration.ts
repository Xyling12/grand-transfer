import { BotDeps } from './types';
import { getMainMenu } from './helpers';

export function registerRegistrationHandlers(deps: BotDeps) {
    const { bot, prisma, adminId, pendingRegistrations } = deps;

    // Handle Role Selection Callbacks
    bot.action(/register_role_(DRIVER|DISPATCHER)/, async (ctx) => {
        const role = ctx.match[1] as 'DRIVER' | 'DISPATCHER';
        const telegramIdBigInt = BigInt(ctx.chat?.id || 0);
        const tgIdStr = telegramIdBigInt.toString();

        try {
            const existing = await prisma.driver.findUnique({ where: { telegramId: telegramIdBigInt } });
            if (existing) {
                return ctx.answerCbQuery('Вы уже подавали заявку.', { show_alert: true });
            }

            pendingRegistrations.set(tgIdStr, { step: 'FIO', role, messageIdsToDelete: [] });
            const state = pendingRegistrations.get(tgIdStr);

            await ctx.answerCbQuery();

            const roleText = state?.role === 'DISPATCHER' ? 'Диспетчера' : 'Водителя';
            const totalSteps = state?.role === 'DISPATCHER' ? '2' : '6';

            const msg = await ctx.reply(`👤 <b>Регистрация ${roleText}</b>\n<b>Шаг 1 из ${totalSteps}: Ваше ФИО</b>\n\nПожалуйста, напишите ваши Фамилию, Имя и Отчество полностью (например: Иванов Иван Иванович).`, {
                parse_mode: 'HTML',
                reply_markup: { remove_keyboard: true }
            });

            if (state) state.messageIdsToDelete.push(msg.message_id);

        } catch (e) {
            console.error('Registration error:', e);
            ctx.answerCbQuery('Произошла ошибка при начале регистрации. Попробуйте еще раз позже.', { show_alert: true });
        }
    });

    // Registration State Machine (called from message handler in index.ts)
}

export async function handleRegistrationMessage(ctx: any, deps: BotDeps): Promise<boolean> {
    const tgIdStr = ctx.chat.id.toString();
    const state = deps.pendingRegistrations.get(tgIdStr);
    if (!state) return false;

    const { prisma, bot, adminId, pendingRegistrations } = deps;

    try {
        // Step 1: FIO
        if (state.step === 'FIO') {
            const text = (ctx.message as any).text;
            if (!text || text.length < 5) {
                const m = await ctx.reply('⚠️ Пожалуйста, введите корректное ФИО текстом (например: Иванов Иван Иванович).');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
            }

            state.fullFio = text;
            state.step = 'PHONE';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            const totalSteps = state.role === 'DISPATCHER' ? '2' : '6';
            const m2 = await ctx.reply(`📱 <b>Шаг 2 из ${totalSteps}: Номер телефона</b>\n\nПожалуйста, нажмите кнопку «Поделиться контактом» ниже, либо введите номер вручную строго в формате, начиная с <b>+7</b> (например: +79991234567).`, {
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
            return true;
        }

        // Step 2: Phone
        if (state.step === 'PHONE') {
            const contact = (ctx.message as any).contact;
            const text = (ctx.message as any).text;

            let phone = '';
            if (contact && contact.phone_number) {
                let rawPhone = String(contact.phone_number).replace(/\D/g, '');
                if (rawPhone.startsWith('8')) rawPhone = '7' + rawPhone.slice(1);
                phone = '+' + rawPhone;
            } else if (text) {
                const cleanText = text.trim();
                if (/^\+7\d{10}$/.test(cleanText)) {
                    phone = cleanText;
                }
            }

            if (!phone) {
                const m = await ctx.reply('⚠️ Пожалуйста, нажмите кнопку «☎️ Поделиться контактом» внизу или отправьте корректный номер текстом <b>СТРОГО начиная с +7</b> (пример: +79991234567).', { parse_mode: 'HTML' });
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
            }

            state.phone = phone;

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            if (state.role === 'DISPATCHER') {
                for (const mid of cleanupMsgs) {
                    ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
                }

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
                return true;
            } else {
                state.step = 'PTS';

                const m2 = await ctx.reply('📄 <b>Шаг 3 из 6: Фото ПТС</b>\n\nПришлите ФОТО Паспорта Транспортного Средства (ПТС).', {
                    parse_mode: 'HTML',
                    reply_markup: { remove_keyboard: true }
                });
                state.messageIdsToDelete.push(m2.message_id);

                for (const mid of cleanupMsgs) {
                    ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
                }
                return true;
            }
        }

        // Step 3: PTS
        if (state.step === 'PTS') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.ptsNumber = largestPhoto.file_id;
            state.step = 'STS';

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];
            state.messageIdsToDelete = [];

            const m2 = await ctx.reply('🪪 <b>Шаг 4 из 6: Фото СТС</b>\n\nПожалуйста, отправьте ФОТО Свидетельства о регистрации ТС (лицевую сторону с Гос. знаком).', { parse_mode: 'HTML' });
            state.messageIdsToDelete.push(m2.message_id);

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }
            return true;
        }

        // Step 4: STS
        if (state.step === 'STS') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
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
            return true;
        }

        // Step 5: LICENSE
        if (state.step === 'LICENSE') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО, а не текст или файл.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
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
            return true;
        }

        // Step 6: CAR
        if (state.step === 'CAR') {
            const photoList = (ctx.message as any).photo;
            if (!photoList || photoList.length === 0) {
                const m = await ctx.reply('⚠️ Пожалуйста, отправьте именно ФОТО автомобиля.');
                state.messageIdsToDelete.push(ctx.message.message_id, m.message_id);
                return true;
            }

            const largestPhoto = photoList[photoList.length - 1];
            state.carPhotoId = largestPhoto.file_id;

            const cleanupMsgs = [...state.messageIdsToDelete, ctx.message.message_id];

            for (const mid of cleanupMsgs) {
                ctx.telegram.deleteMessage(ctx.chat.id, mid).catch(() => { });
            }

            const telegramIdBigInt = BigInt(ctx.chat.id);
            await prisma.driver.create({
                data: {
                    telegramId: telegramIdBigInt,
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    fullFio: state.fullFio,
                    phone: state.phone,
                    ptsNumber: state.ptsNumber,
                    stsPhotoId: state.stsPhotoId,
                    licensePhotoId: state.licensePhotoId,
                    carPhotoId: state.carPhotoId,
                    status: 'PENDING',
                    role: 'DRIVER'
                }
            });

            pendingRegistrations.delete(tgIdStr);

            await ctx.reply('✅ <b>Заявка успешно отправлена!</b>\n\nВы предоставили все необходимые документы. Ваша заявка отправлена администратору на рассмотрение. Вы получите уведомление о доступе.', { parse_mode: 'HTML' });

            try {
                const admins = await prisma.driver.findMany({ where: { role: 'ADMIN', status: 'APPROVED' } });
                const userStr = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || `ID: ${ctx.from.id}`);
                const adminMsg = `🚨 <b>Новая заявка на регистрацию!</b>\n\n👤 ФИО: ${state.fullFio}\nTG: ${userStr}\n📱 Тел: ${state.phone}\n\nЗайдите в раздел 👥 <b>Пользователи</b> на сайте, чтобы просмотреть фотографии ПТС, СТС и автомобиля, после чего одобрите или отклоните заявку.`;

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
            return true;
        }

    } catch (err) {
        console.error('State machine error:', err);
        ctx.reply('❌ Ошибка при обработке данных. Начните заново с команды /start');
        pendingRegistrations.delete(tgIdStr);
    }

    return true;
}
