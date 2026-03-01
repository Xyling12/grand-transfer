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
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
        }

        // Gather stats
        const [totalOrders, completedOrders, activeOrders, totalDrivers, pendingDrivers] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'COMPLETED' } }),
            prisma.order.count({ where: { status: { in: ['NEW', 'DISPATCHED', 'TAKEN'] } } }),
            prisma.driver.count({ where: { status: 'APPROVED' } }),
            prisma.driver.count({ where: { status: 'PENDING' } }),
        ]);

        // Calculate revenue from completed orders
        const revenueResult = await prisma.order.aggregate({
            _sum: { priceEstimate: true },
            where: { status: 'COMPLETED' },
        });

        const revenue = revenueResult._sum.priceEstimate || 0;

        return NextResponse.json({
            totalOrders,
            completedOrders,
            activeOrders,
            totalDrivers,
            pendingDrivers,
            revenue,
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
