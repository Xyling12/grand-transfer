import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Secret to sign the JWT, preferably from env, fallback to bot token for ease of use in this project
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'fallback_secret_grand_transfer';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // Telegram widget sends: id, first_name, last_name, username, photo_url, auth_date, hash
        const { hash, ...userData } = data;

        if (!hash) {
            return NextResponse.json({ error: "Missing hash" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        // Verify Telegram Auth Hash
        // 1. Create a data-check-string
        const dataCheckArr = [];
        for (const [key, value] of Object.entries(userData)) {
            dataCheckArr.push(`${key}=${value}`);
        }
        dataCheckArr.sort();
        const dataCheckString = dataCheckArr.join('\n');

        // 2. Compute Secret Key
        const secretKey = crypto.createHash('sha256').update(botToken).digest();

        // 3. Compute Hash
        const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (computedHash !== hash) {
            return NextResponse.json({ error: "Invalid Telegram authentication hash" }, { status: 401 });
        }

        // 4. Check if auth_date is recent (prevent replay attacks, e.g. 24h)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp - Number(userData.auth_date) > 86400) {
            return NextResponse.json({ error: "Authentication data has expired" }, { status: 401 });
        }

        // --- AUTHENTICATION SUCCESSFUL ---
        // Check DB for Admin role
        const telegramId = BigInt(userData.id);
        const adminUser = await prisma.driver.findUnique({
            where: { telegramId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return NextResponse.json({ error: "Отказано в доступе. Вы не являетесь администратором." }, { status: 403 });
        }

        // Generate JWT Token
        const tokenPayload = {
            id: adminUser.id,
            telegramId: adminUser.telegramId.toString(),
            role: adminUser.role,
            firstName: adminUser.firstName,
            fullFio: adminUser.fullFio
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        // Set HTTP-only Cookie
        const response = NextResponse.json({ success: true, message: "Logged in successfully", redirectUrl: "/admin/drivers" });
        response.cookies.set({
            name: 'admin_session',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
