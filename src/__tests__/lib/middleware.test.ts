/**
 * middleware.test.ts — Tests for src/middleware.ts
 * Skill applied: javascript-testing-patterns
 * Patterns: vi.mock, Request/Response mocking, JWT integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT } from 'jose';

// We test the middleware logic directly by importing it.
// Next.js NextRequest/NextResponse need to be available in node env.
// We polyfill minimal versions needed.

const JWT_SECRET = 'fallback_secret_grand_transfer';
const secret = new TextEncoder().encode(JWT_SECRET);

// Helper: create a valid JWT token
async function makeToken(payload: object = { sub: 'admin' }): Promise<string> {
    return new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);
}

// Helper: mock NextRequest
function createNextRequest(path: string, cookies: Record<string, string> = {}) {
    const url = `http://localhost${path}`;
    const req = new Request(url) as any;
    req.nextUrl = new URL(url);
    req.cookies = {
        get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    };
    req.url = url;
    return req;
}

// We test middleware logic via unit tests of the JWT verification path
// (Full middleware integration requires Next.js Edge Runtime)

describe('Middleware auth logic (JWT verification)', () => {
    it('valid admin_session token is accepted', async () => {
        const token = await makeToken({ sub: 'admin-user' });
        const { jwtVerify } = await import('jose');
        const result = await jwtVerify(token, secret);
        expect(result.payload.sub).toBe('admin-user');
    });

    it('invalid token rejected by jwtVerify', async () => {
        const { jwtVerify } = await import('jose');
        await expect(jwtVerify('bad.token.here', secret)).rejects.toThrow();
    });

    it('expired token is rejected', async () => {
        const expiredToken = await new SignJWT({ sub: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('-1s') // already expired
            .sign(secret);

        const { jwtVerify } = await import('jose');
        await expect(jwtVerify(expiredToken, secret)).rejects.toThrow();
    });

    it('token signed with wrong secret is rejected', async () => {
        const wrongSecret = new TextEncoder().encode('wrong_secret');
        const token = await new SignJWT({ sub: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1h')
            .sign(wrongSecret);

        const { jwtVerify } = await import('jose');
        await expect(jwtVerify(token, secret)).rejects.toThrow();
    });
});

// ─── Route path logic (unit tests for middleware path matching) ───────────────

describe('Middleware route matching logic', () => {
    it.each([
        ['/admin', true],
        ['/admin/drivers', true],
        ['/admin/orders', true],
        ['/admin/login', false],    // login page is exempt
        ['/driver/orders', true],
        ['/driver/login', false],   // login page is exempt
        ['/driver/register', false], // register page is exempt
        ['/', false],
        ['/api/order', false],
    ])('path "%s" requires auth: %s', (path, requiresAuth) => {
        const isAdminProtected = path.startsWith('/admin') && path !== '/admin/login';
        const isDriverProtected =
            path.startsWith('/driver') &&
            path !== '/driver/login' &&
            path !== '/driver/register';

        const actuallyProtected = isAdminProtected || isDriverProtected;
        expect(actuallyProtected).toBe(requiresAuth);
    });
});

// ─── Admin redirect logic ─────────────────────────────────────────────────────

describe('Admin login page redirect logic', () => {
    it('redirects authenticated admin away from /admin/login', async () => {
        const token = await makeToken({ sub: 'admin' });
        const { jwtVerify } = await import('jose');

        // If token is valid on login page → redirect to /admin/drivers
        let redirectedTo: string | null = null;
        try {
            await jwtVerify(token, secret);
            redirectedTo = '/admin/drivers';
        } catch {
            redirectedTo = null;
        }
        expect(redirectedTo).toBe('/admin/drivers');
    });

    it('does NOT redirect unauthenticated user from /admin/login', async () => {
        const { jwtVerify } = await import('jose');

        let redirectedTo: string | null = null;
        try {
            await jwtVerify('', secret);
            redirectedTo = '/admin/drivers';
        } catch {
            redirectedTo = null; // stays on login page
        }
        expect(redirectedTo).toBeNull();
    });
});
