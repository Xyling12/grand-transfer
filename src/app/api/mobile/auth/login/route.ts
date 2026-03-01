import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createDriverToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Введите номер телефона и пароль' },
                { status: 400 }
            );
        }

        const normalizedPhone = phone.replace(/[^+\d]/g, '');

        // Find driver by phone
        const drivers = await prisma.driver.findMany({
            where: { phone: normalizedPhone }
        });

        if (drivers.length === 0) {
            return NextResponse.json(
                { error: 'Пользователь не найден' },
                { status: 404 }
            );
        }

        const driver = drivers[0];

        // Check password
        if (!driver.passwordHash) {
            return NextResponse.json(
                { error: 'Этот аккаунт зарегистрирован через Telegram. Войдите через бота.' },
                { status: 403 }
            );
        }

        if (!verifyPassword(password, driver.passwordHash)) {
            return NextResponse.json(
                { error: 'Неверный пароль' },
                { status: 401 }
            );
        }

        // Check status
        if (driver.status === 'BANNED') {
            return NextResponse.json(
                { error: 'Ваш аккаунт заблокирован' },
                { status: 403 }
            );
        }

        if (driver.status === 'PENDING') {
            return NextResponse.json(
                { error: 'Ваша регистрация ещё не одобрена администратором' },
                { status: 403 }
            );
        }

        // Generate JWT
        const token = await createDriverToken(driver);

        const response = NextResponse.json({
            success: true,
            token,
            driver: {
                id: driver.id,
                fullFio: driver.fullFio,
                phone: driver.phone,
                role: driver.role,
                status: driver.status,
            }
        });

        // Set HTTP-only cookie
        response.cookies.set({
            name: 'driver_session',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Ошибка входа' },
            { status: 500 }
        );
    }
}
