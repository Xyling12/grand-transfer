import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDriverToken } from '@/lib/auth';

// Helper to get authenticated driver
async function getDriver(req: NextRequest) {
    const token = req.cookies.get('driver_session')?.value;
    if (!token) return null;
    const payload = await verifyDriverToken(token);
    if (!payload) return null;
    const driver = await prisma.driver.findUnique({ where: { id: payload.id } });
    if (!driver || driver.status !== 'APPROVED') return null;
    return driver;
}

// GET — list orders (available or my orders)
export async function GET(req: NextRequest) {
    try {
        const driver = await getDriver(req);
        if (!driver) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'available';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const skip = (page - 1) * limit;

        let where: any = {};

        switch (filter) {
            case 'available':
                // New orders not yet taken
                where = { status: 'NEW' };
                break;
            case 'dispatched':
                // Orders dispatched to drivers
                where = { status: 'DISPATCHED' };
                break;
            case 'my':
                // Orders taken by this driver
                where = { driverId: driver.id, status: { in: ['TAKEN', 'DISPATCHED'] } };
                break;
            case 'active':
                // All active (for dispatchers/admins)
                if (driver.role === 'ADMIN' || driver.role === 'DISPATCHER') {
                    where = { status: { in: ['NEW', 'DISPATCHED', 'TAKEN'] } };
                } else {
                    where = { driverId: driver.id, status: { in: ['TAKEN', 'DISPATCHED'] } };
                }
                break;
            case 'history':
                // Completed/cancelled orders
                if (driver.role === 'ADMIN' || driver.role === 'DISPATCHER') {
                    where = { status: { in: ['COMPLETED', 'CANCELLED'] } };
                } else {
                    where = { driverId: driver.id, status: { in: ['COMPLETED', 'CANCELLED'] } };
                }
                break;
            default:
                where = { status: 'NEW' };
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    driver: { select: { firstName: true, fullFio: true, phone: true } },
                    dispatcher: { select: { firstName: true, fullFio: true, phone: true } },
                }
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({
                ...o,
                priceEstimate: o.priceEstimate ? Number(o.priceEstimate) : null,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Orders list error:', error);
        return NextResponse.json({ error: 'Ошибка загрузки заказов' }, { status: 500 });
    }
}

// POST — take order / update status
export async function POST(req: NextRequest) {
    try {
        const driver = await getDriver(req);
        if (!driver) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, action } = body;

        if (!orderId || !action) {
            return NextResponse.json({ error: 'Укажите orderId и action' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
        if (!order) {
            return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
        }

        switch (action) {
            case 'take': {
                if (order.status !== 'NEW' && order.status !== 'DISPATCHED') {
                    return NextResponse.json({ error: 'Этот заказ уже взят' }, { status: 400 });
                }
                const updated = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'TAKEN',
                        driverId: driver.id,
                        takenAt: new Date(),
                    }
                });
                return NextResponse.json({ success: true, order: updated });
            }
            case 'complete': {
                if (order.driverId !== driver.id && driver.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Вы не можете завершить чужой заказ' }, { status: 403 });
                }
                const updated = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                    }
                });
                return NextResponse.json({ success: true, order: updated });
            }
            case 'cancel': {
                if (order.driverId !== driver.id && driver.role !== 'ADMIN' && driver.role !== 'DISPATCHER') {
                    return NextResponse.json({ error: 'Нет прав на отмену' }, { status: 403 });
                }
                const updated = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'CANCELLED',
                        cancelledAt: new Date(),
                        cancelledBy: driver.id,
                        cancelReason: body.reason || 'Отменено через приложение',
                    }
                });
                return NextResponse.json({ success: true, order: updated });
            }
            case 'dispatch': {
                if (driver.role !== 'ADMIN' && driver.role !== 'DISPATCHER') {
                    return NextResponse.json({ error: 'Нет прав диспетчера' }, { status: 403 });
                }
                const updated = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'DISPATCHED',
                        dispatcherId: driver.id,
                    }
                });
                return NextResponse.json({ success: true, order: updated });
            }
            default:
                return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
        }
    } catch (error) {
        console.error('Order action error:', error);
        return NextResponse.json({ error: 'Ошибка обработки заказа' }, { status: 500 });
    }
}
