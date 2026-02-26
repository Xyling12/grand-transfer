import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Защищаем все роуты, начинающиеся с /admin и /api/admin
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
        const basicAuth = req.headers.get('authorization');

        if (basicAuth) {
            const authValue = basicAuth.split(' ')[1];
            // Decode base64
            const [user, pwd] = Buffer.from(authValue, 'base64').toString().split(':');

            // Берем логин и пароль из .env, или используем дефолтные при локальной разработке
            const expectedUser = process.env.ADMIN_USER || 'admin';
            const expectedPwd = process.env.ADMIN_PASSWORD || 'grand123';

            if (user === expectedUser && pwd === expectedPwd) {
                return NextResponse.next();
            }
        }

        // Если пароль неверный или его нет — отдаем 401 и требуем браузерное окно логина (Basic Auth)
        return new NextResponse('Требуется авторизация', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Admin Dashboard"',
            },
        });
    }

    return NextResponse.next();
}

// Указываем, к каким путям применять middleware
export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
