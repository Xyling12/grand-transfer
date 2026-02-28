import crypto from 'crypto';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'fallback_secret_grand_transfer';

// --- Password Hashing (using native Node.js crypto, no bcrypt dependency needed) ---

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return computed === hash;
}

// --- JWT Token Management ---

export async function createDriverToken(driver: {
    id: string;
    telegramId?: bigint | null;
    role: string;
    firstName?: string | null;
    fullFio?: string | null;
    phone?: string | null;
}): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);
    return new SignJWT({
        id: driver.id,
        telegramId: driver.telegramId?.toString() || null,
        role: driver.role,
        firstName: driver.firstName,
        fullFio: driver.fullFio,
        phone: driver.phone,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(secret);
}

export async function verifyDriverToken(token: string) {
    const secret = new TextEncoder().encode(JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as {
            id: string;
            telegramId?: string | null;
            role: string;
            firstName?: string | null;
            fullFio?: string | null;
            phone?: string | null;
        };
    } catch {
        return null;
    }
}
