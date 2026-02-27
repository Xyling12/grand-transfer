import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Only Admins should be calling this (the frontend should restrict UI, but server should technically check tokens too).
// We rely on simple implementation for now, but a real app would check session here.

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, status, role } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (role) updateData.role = role;

        const updatedUser = await prisma.driver.update({
            where: { id: Number(id) },
            data: updateData
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (e) {
        console.error('Failed to update user', e);
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        // Check if there are related orders before deleting or let Prisma handle cascade
        await prisma.driver.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Failed to delete user', e);
        // Usually fails if there is a foreign key constraint (like the user has orders)
        return NextResponse.json({ success: false, error: 'Failed to delete user. The user might have orders associated with them.' }, { status: 500 });
    }
}
