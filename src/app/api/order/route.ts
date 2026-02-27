import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/telegram';
import { sendEmailNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

// --- Simple In-Memory Rate Limiter ---
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per window

setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
        if (val.resetAt < now) rateLimitMap.delete(key);
    }
}, 60 * 1000);

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || entry.resetAt < now) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
    try {
        // Rate limiting check
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, error: 'Слишком много запросов. Попробуйте через минуту.' },
                { status: 429 }
            );
        }

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
                    scheduledDate: body.dateTime || null,
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
