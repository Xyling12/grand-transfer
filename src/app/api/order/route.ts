import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderNotification } from '@/lib/telegram';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Save order to Prisma SQLite
        const order = await prisma.order.create({
            data: {
                fromCity: body.fromCity,
                toCity: body.toCity,
                tariff: body.tariff,
                passengers: body.passengers,
                priceEstimate: body.priceEstimate ? parseFloat(body.priceEstimate) : null,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                comments: body.comments,
            }
        });

        // Fire and forget Telegram Notification
        body.id = order.id; // Include the DB ID in the notification
        sendOrderNotification(body).catch(console.error);

        return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });

    } catch (error) {
        console.error('API Order Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
    }
}
