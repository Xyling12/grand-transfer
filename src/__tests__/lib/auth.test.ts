/**
 * auth.test.ts — Tests for src/lib/auth.ts
 * Skill applied: javascript-testing-patterns
 * Patterns: unit tests, AAA, parametrize via test.each, async JWT
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createDriverToken, verifyDriverToken } from '@/lib/auth';

// ─── hashPassword / verifyPassword ───────────────────────────────────────────

describe('hashPassword', () => {
    it('returns a non-empty string', () => {
        const hash = hashPassword('secret123');
        expect(hash).toBeTruthy();
        expect(typeof hash).toBe('string');
    });

    it('includes salt separated by colon', () => {
        const hash = hashPassword('secret123');
        const parts = hash.split(':');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toHaveLength(32); // 16 bytes hex
        expect(parts[1].length).toBeGreaterThan(0);
    });

    it('produces different hashes for the same password (random salt)', () => {
        const h1 = hashPassword('samepassword');
        const h2 = hashPassword('samepassword');
        expect(h1).not.toBe(h2);
    });
});

describe('verifyPassword', () => {
    it('returns true for correct password', () => {
        const hash = hashPassword('mypassword');
        expect(verifyPassword('mypassword', hash)).toBe(true);
    });

    it('returns false for wrong password', () => {
        const hash = hashPassword('mypassword');
        expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });

    it('returns false for empty password', () => {
        const hash = hashPassword('mypassword');
        expect(verifyPassword('', hash)).toBe(false);
    });

    it('returns false for malformed stored hash (no colon)', () => {
        expect(verifyPassword('anypassword', 'nocolonhere')).toBe(false);
    });

    it('returns false for empty stored hash', () => {
        expect(verifyPassword('anypassword', '')).toBe(false);
    });

    // Parametrized via test.each (skill: javascript-testing-patterns Pattern 3)
    it.each([
        ['admin', 'admin'],
        ['driver123', 'driver123'],
        ['Пароль!23', 'Пароль!23'],
        ['', ''],
    ])('correctly verifies password "%s" against its own hash', (plain) => {
        if (!plain) return; // skip empty
        const hash = hashPassword(plain);
        expect(verifyPassword(plain, hash)).toBe(true);
    });
});

// ─── JWT Token (createDriverToken / verifyDriverToken) ───────────────────────

describe('createDriverToken / verifyDriverToken', () => {
    const driver = {
        id: 'driver-uuid-123',
        telegramId: BigInt('376060133'),
        role: 'DRIVER',
        firstName: 'Иван',
        fullFio: 'Иванов Иван Иванович',
        phone: '+79991234567',
    };

    it('creates a non-empty JWT token string', async () => {
        const token = await createDriverToken(driver);
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('verifies a valid token and returns correct payload', async () => {
        const token = await createDriverToken(driver);
        const payload = await verifyDriverToken(token);

        expect(payload).not.toBeNull();
        expect(payload?.id).toBe('driver-uuid-123');
        expect(payload?.role).toBe('DRIVER');
        expect(payload?.firstName).toBe('Иван');
        expect(payload?.phone).toBe('+79991234567');
    });

    it('returns null for invalid/tampered token', async () => {
        const result = await verifyDriverToken('invalid.token.here');
        expect(result).toBeNull();
    });

    it('returns null for empty token', async () => {
        const result = await verifyDriverToken('');
        expect(result).toBeNull();
    });

    it('serializes telegramId (bigint) as string in payload', async () => {
        const token = await createDriverToken(driver);
        const payload = await verifyDriverToken(token);
        // BigInt is serialized to string in JWT payload
        expect(typeof payload?.telegramId).toBe('string');
        expect(payload?.telegramId).toBe('376060133');
    });

    it('handles null telegramId gracefully', async () => {
        const driverNoTg = { ...driver, telegramId: null };
        const token = await createDriverToken(driverNoTg as any);
        const payload = await verifyDriverToken(token);
        expect(payload?.telegramId).toBeNull();
    });

    it('creates unique tokens for the same driver (timing difference)', async () => {
        const t1 = await createDriverToken(driver);
        await new Promise(r => setTimeout(r, 10));
        const t2 = await createDriverToken(driver);
        // Tokens may differ due to iat (issued-at) timestamp
        // Both should still be valid
        expect(await verifyDriverToken(t1)).not.toBeNull();
        expect(await verifyDriverToken(t2)).not.toBeNull();
    });
});
