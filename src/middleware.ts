import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret to verify the JWT, matching the login route
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'fallback_secret_grand_transfer';

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Check if the current route is the login page itself to prevent infinite redirects
    const isLoginPage = path === '/admin/login';

    // Protect all /admin routes except the login route and API endpoints handling login
    if (path.startsWith('/admin') && !isLoginPage) {
        const token = req.cookies.get('admin_session')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }

        try {
            // Verify JWT token using jose (Next.js Edge runtime compatible)
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);

            // Allow access to the protected route
            return NextResponse.next();
        } catch (error) {
            console.error('JWT Verification failed in middleware:', error);
            // Token is invalid or expired
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    // Redirect authenticated users away from the login page
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

    return NextResponse.next();
}

// Specify paths to apply middleware
export const config = {
    matcher: ['/admin/:path*'],
};
