import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderNotification } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        let orderId = "N/A";
        try {
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
            orderId = order.id.toString();
        } catch (dbError) {
            console.warn("Could not save to SQLite DB (expected on Vercel):", dbError);
        }

        // Fire and forget Telegram Notification
        body.id = orderId; // Include the DB ID (or N/A) in the notification
        sendOrderNotification(body).catch(console.error);

        return NextResponse.json({ success: true, orderId: orderId }, { status: 200 });

    } catch (error) {
        console.error('API Order Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
    }
}
