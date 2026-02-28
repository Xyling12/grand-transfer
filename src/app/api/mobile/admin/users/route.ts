import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDriverToken } from '@/lib/auth';

async function getAdmin(req: NextRequest) {
    const token = req.cookies.get('driver_session')?.value;
    if (!token) return null;
    const payload = await verifyDriverToken(token);
    if (!payload) return null;
    const driver = await prisma.driver.findUnique({ where: { id: payload.id } });
    if (!driver || driver.status !== 'APPROVED') return null;
    if (driver.role !== 'ADMIN' && driver.role !== 'DISPATCHER') return null;
    return driver;
}

// GET — list all users
export async function GET(req: NextRequest) {
    const admin = await getAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Нет прав' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    let where: any = {};
    if (filter === 'pending') where = { status: 'PENDING' };
    else if (filter === 'approved') where = { status: 'APPROVED' };
    else if (filter === 'banned') where = { status: 'BANNED' };

    const users = await prisma.driver.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    ordersAsDriver: true,
                    ordersAsDispatcher: true,
                }
            }
        }
    });

    return NextResponse.json({
        users: users.map(u => ({
            id: u.id,
            telegramId: u.telegramId.toString(),
            username: u.username,
            firstName: u.firstName,
            fullFio: u.fullFio,
            phone: u.phone,
            role: u.role,
            status: u.status,
            ptsNumber: u.ptsNumber,
            carDescription: (u as any).carDescription,
            createdAt: u.createdAt,
            ordersCount: u._count.ordersAsDriver,
            dispatchCount: u._count.ordersAsDispatcher,
        }))
    });
}

// POST — approve / ban / change role
export async function POST(req: NextRequest) {
    const admin = await getAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Нет прав' }, { status: 403 });

    // Only ADMIN can manage users (not DISPATCHER)
    if (admin.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Только ADMIN может управлять пользователями' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId || !action) {
        return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    const user = await prisma.driver.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    switch (action) {
        case 'approve': {
            await prisma.driver.update({
                where: { id: userId },
                data: { status: 'APPROVED' }
            });
            // Log
            await prisma.auditLog.create({
                data: {
                    action: 'APPROVE',
                    actorId: admin.id,
                    actorName: admin.fullFio || admin.firstName || 'Admin',
                    targetId: userId,
                    targetName: user.fullFio || user.firstName || 'User',
                }
            });
            return NextResponse.json({ success: true });
        }
        case 'ban': {
            await prisma.driver.update({
                where: { id: userId },
                data: { status: 'BANNED' }
            });
            await prisma.auditLog.create({
                data: {
                    action: 'BAN',
                    actorId: admin.id,
                    actorName: admin.fullFio || admin.firstName || 'Admin',
                    targetId: userId,
                    targetName: user.fullFio || user.firstName || 'User',
                }
            });
            return NextResponse.json({ success: true });
        }
        case 'unban': {
            await prisma.driver.update({
                where: { id: userId },
                data: { status: 'APPROVED' }
            });
            await prisma.auditLog.create({
                data: {
                    action: 'UNBAN',
                    actorId: admin.id,
                    actorName: admin.fullFio || admin.firstName || 'Admin',
                    targetId: userId,
                    targetName: user.fullFio || user.firstName || 'User',
                }
            });
            return NextResponse.json({ success: true });
        }
        case 'set_role': {
            if (!role || !['DRIVER', 'DISPATCHER', 'ADMIN'].includes(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }
            const oldRole = user.role;
            await prisma.driver.update({
                where: { id: userId },
                data: { role }
            });
            await prisma.auditLog.create({
                data: {
                    action: 'ROLE_CHANGE',
                    actorId: admin.id,
                    actorName: admin.fullFio || admin.firstName || 'Admin',
                    targetId: userId,
                    targetName: user.fullFio || user.firstName || 'User',
                    details: `${oldRole} → ${role}`,
                }
            });
            return NextResponse.json({ success: true });
        }
        case 'delete': {
            await prisma.driver.delete({ where: { id: userId } });
            await prisma.auditLog.create({
                data: {
                    action: 'DELETE_USER',
                    actorId: admin.id,
                    actorName: admin.fullFio || admin.firstName || 'Admin',
                    targetId: userId,
                    targetName: user.fullFio || user.firstName || 'User',
                }
            });
            return NextResponse.json({ success: true });
        }
        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
}
