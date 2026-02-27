"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDrivers() {
    const drivers = await prisma.driver.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return drivers.map((d: any) => ({
        ...d,
        telegramId: d.telegramId.toString()
    }));
}

export async function updateDriverStatus(id: string, status: string) {
    if (status !== 'PENDING' && status !== 'APPROVED' && status !== 'BANNED') {
        throw new Error('Invalid status');
    }

    await prisma.driver.update({
        where: { id },
        data: { status }
    });

    revalidatePath('/admin/drivers');
}

export async function deleteDriver(id: string) {
    await prisma.driver.delete({
        where: { id }
    });
    revalidatePath('/admin/drivers');
}
