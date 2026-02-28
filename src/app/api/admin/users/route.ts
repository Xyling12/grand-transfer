import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTgNotification(telegramId: bigint | string, message: string) {
    if (!BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId.toString(),
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Failed to send TG notification', e);
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, status, role } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.driver.findUnique({ where: { id: String(id) } });
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};
        // If action is unban (status: APPROVED, but currently BANNED)
        if (status === 'APPROVED' && user.status === 'BANNED') {
            updateData.status = 'PENDING';
            updateData.role = 'USER';
        } else {
            if (status) updateData.status = status;
            if (role) updateData.role = role;
        }

        const updatedUser = await prisma.driver.update({
            where: { id: String(id) },
            data: updateData
        });

        // Notifications
        if (updatedUser.status !== user.status) {
            let msg = '';
            if (updatedUser.status === 'APPROVED') msg = '✅ Ваш аккаунт в системе <b>одобрен</b> администратором.\n\nНажмите /start для входа в меню.';
            if (updatedUser.status === 'BANNED') msg = '🚫 Ваш аккаунт был <b>заблокирован</b> администратором.';
            if (updatedUser.status === 'PENDING' && user.status === 'BANNED') msg = '🔄 Ваш аккаунт был <b>разблокирован</b> администратором.\n\n⚠️ Обратите внимание: Ваша роль была сброшена. Для дальнейшей работы вам необходимо <b>отправить заявку заново</b> через форму регистрации.';
            else if (updatedUser.status === 'PENDING') msg = '⏳ Ваш аккаунт переведен назад в статус <b>ожидания</b>.';
            if (msg) await sendTgNotification(user.telegramId, msg);
        }

        if (updatedUser.role !== user.role) {
            const roleNames: Record<string, string> = {
                'DRIVER': 'Водитель',
                'DISPATCHER': 'Диспетчер',
                'ADMIN': 'Администратор',
                'USER': 'Пользователь'
            };
            const roleStr = roleNames[role] || role;
            await sendTgNotification(user.telegramId, `🔄 Ваша роль в системе изменена на: <b>${roleStr}</b>`);
        }

        // Serialize before responding due to BigInt
        const serializedUser = {
            ...updatedUser,
            telegramId: updatedUser.telegramId.toString()
        };

        return NextResponse.json({ success: true, user: serializedUser });
    } catch (e) {
        console.error('Failed to update user', e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.driver.findUnique({ where: { id: String(id) } });
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Prevent FK errors by unlinking existing orders
        await prisma.order.updateMany({
            where: { driverId: String(id) },
            data: { driverId: null }
        });
        await prisma.order.updateMany({
            where: { dispatcherId: String(id) },
            data: { dispatcherId: null }
        });

        await prisma.driver.delete({
            where: { id: String(id) }
        });

        await sendTgNotification(user.telegramId, `🗑 Ваш аккаунт был <b>полностью удален</b> из системы администратором.`);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Failed to delete user', e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
