import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderNotification } from '@/lib/telegram';
import { sendEmailNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        let orderId = "N/A";
        try {
            const host = req.headers.get('host') || 'unknown';
            const origin = req.headers.get('origin') || host;
            const sourceSite = origin.includes('taximezhgorod') ? 'taximezhgorod777.ru' : 'межгород.com';

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
                    sourceSite: sourceSite,
                }
            });
            orderId = order.id.toString();
        } catch (dbError) {
            console.warn("Could not save to SQLite DB (expected on Vercel):", dbError);
        }

        // Send Telegram Notification (must await on Vercel otherwise Lambda is killed instantly)
        const host = req.headers.get('host') || 'unknown';
        const origin = req.headers.get('origin') || host;
        body.sourceSite = origin.includes('taximezhgorod') ? 'taximezhgorod777.ru' : 'межгород.com';
        body.id = orderId; // Include the DB ID (or N/A) in the notification
        const tgSuccess = await sendOrderNotification(body);

        // Send Email Notification ALWAYS
        try {
            await sendEmailNotification(body);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
        }

        return NextResponse.json({ success: true, orderId: orderId, telegramFallback: !tgSuccess }, { status: 200 });

    } catch (error) {
        console.error('API Order Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
    }
}
