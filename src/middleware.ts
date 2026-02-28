import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret to verify the JWT, matching the login route
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'fallback_secret_grand_transfer';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // --- Admin routes protection ---
    const isLoginPage = path === '/admin/login';

    if (path.startsWith('/admin') && !isLoginPage) {
        const token = req.cookies.get('admin_session')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (error) {
            console.error('JWT Verification failed in middleware:', error);
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    // Redirect authenticated admin users away from the login page
    if (isLoginPage) {
        const token = req.cookies.get('admin_session')?.value;
        if (token) {
            try {
                const secret = new TextEncoder().encode(JWT_SECRET);
                await jwtVerify(token, secret);
                return NextResponse.redirect(new URL('/admin/drivers', req.url));
            } catch (e) {
                // Invalid token, just render login page normally
            }
        }
    }

    // --- Driver PWA routes protection ---
    const isDriverLoginPage = path === '/driver/login';
    const isDriverRegisterPage = path === '/driver/register';

    if (path.startsWith('/driver') && !isDriverLoginPage && !isDriverRegisterPage) {
        const token = req.cookies.get('driver_session')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/driver/login', req.url));
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL('/driver/login', req.url));
        }
    }

    // Redirect authenticated drivers away from login
    if (isDriverLoginPage) {
        const token = req.cookies.get('driver_session')?.value;
        if (token) {
            try {
                const secret = new TextEncoder().encode(JWT_SECRET);
                await jwtVerify(token, secret);
                return NextResponse.redirect(new URL('/driver/orders', req.url));
            } catch (e) {
                // Invalid token
            }
        }
    }

    return NextResponse.next();
}

// Specify paths to apply middleware
export const config = {
    matcher: ['/admin/:path*', '/driver/:path*'],
};

