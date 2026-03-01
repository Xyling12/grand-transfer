import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDriverToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Support both cookie and Bearer token
        let token = req.cookies.get('driver_session')?.value;
        if (!token) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
        }
        if (!token) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const payload = await verifyDriverToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { id: payload.id }
        });

        if (!driver || driver.status === 'BANNED') {
            return NextResponse.json({ error: 'Доступ заблокирован' }, { status: 403 });
        }

        return NextResponse.json({
            driver: {
                id: driver.id,
                fullFio: driver.fullFio,
                firstName: driver.firstName,
                phone: driver.phone,
                role: driver.role,
                status: driver.status,
            }
        });

    } catch (error) {
        console.error('Me endpoint error:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}

