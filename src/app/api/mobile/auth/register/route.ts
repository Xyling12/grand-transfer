import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createDriverToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { phone, password, fullFio, ptsNumber, stsNumber, carDescription, role } = body;

        // Validation
        if (!phone || !password || !fullFio) {
            return NextResponse.json(
                { error: 'Обязательные поля: телефон, пароль, ФИО' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Пароль должен быть не менее 6 символов' },
                { status: 400 }
            );
        }

        // Normalize phone
        const normalizedPhone = phone.replace(/[^+\d]/g, '');

        // Check if driver with this phone already exists
        const existing = await prisma.driver.findMany({
            where: { phone: normalizedPhone }
        });
        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Пользователь с таким номером уже зарегистрирован' },
                { status: 409 }
            );
        }

        // Create driver with PENDING status (needs admin approval)
        const passwordHashed = hashPassword(password);
        const driverRole = role === 'DISPATCHER' ? 'DISPATCHER' : 'DRIVER';

        const driver = await prisma.driver.create({
            data: {
                telegramId: BigInt(0), // Non-Telegram user, placeholder
                phone: normalizedPhone,
                fullFio: fullFio.trim(),
                firstName: fullFio.trim().split(' ')[0],
                ptsNumber: ptsNumber || null,
                stsPhotoId: stsNumber || null, // Reusing stsPhotoId for STS number in PWA
                carDescription: carDescription || null,
                passwordHash: passwordHashed,
                role: driverRole,
                status: 'PENDING',
            }
        });

        // Notify admin via Telegram about new registration
        try {
            const token = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/['"]/g, '').trim();
            const chatId = (process.env.TELEGRAM_CHAT_ID || '').replace(/['"]/g, '').trim();
            if (token && chatId) {
                const roleText = driverRole === 'DISPATCHER' ? 'Диспетчер' : 'Водитель';
                const msg = `📱 <b>Новая регистрация через приложение!</b>\n\n` +
                    `👤 <b>ФИО:</b> ${fullFio}\n` +
                    `📞 <b>Телефон:</b> ${normalizedPhone}\n` +
                    `🎭 <b>Роль:</b> ${roleText}\n` +
                    `🚗 <b>Авто:</b> ${carDescription || 'Не указано'}\n` +
                    `📋 <b>ПТС:</b> ${ptsNumber || 'Не указан'}\n` +
                    `📋 <b>СТС:</b> ${stsNumber || 'Не указан'}\n\n` +
                    `⏳ Ожидает одобрения`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: msg,
                        parse_mode: 'HTML'
                    })
                });
            }
        } catch (e) {
            console.error('Failed to notify admin about new registration:', e);
        }

        return NextResponse.json({
            success: true,
            message: 'Регистрация отправлена на рассмотрение. Ожидайте одобрения администратора.',
            driverId: driver.id
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Ошибка при регистрации' },
            { status: 500 }
        );
    }
}
