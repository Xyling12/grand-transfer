import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDriverToken } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.cookies.get('driver_session')?.value;
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

        const payload = await verifyDriverToken(token);
        if (!payload) return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });

        const { id } = await params;
        const orderId = parseInt(id);
        if (isNaN(orderId)) return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                driver: { select: { firstName: true, fullFio: true, phone: true } },
                dispatcher: { select: { firstName: true, fullFio: true, phone: true } },
            }
        });

        if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });

        return NextResponse.json({
            ...order,
            priceEstimate: order.priceEstimate ? Number(order.priceEstimate) : null,
        });
    } catch (error) {
        console.error('Order detail error:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
