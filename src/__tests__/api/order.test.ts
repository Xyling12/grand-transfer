import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock dependencies BEFORE importing the route ---
vi.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/telegram', () => ({
    sendOrderNotification: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendEmailNotification: vi.fn(),
}));

import { POST } from '@/app/api/order/route';
import { prisma } from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/telegram';
import { sendEmailNotification } from '@/lib/email';

// Helper to create a mock Request
function createMockRequest(body: object, headers: Record<string, string> = {}): Request {
    return new Request('http://localhost/api/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            host: 'xn--c1acbe2apap.com',
            ...headers,
        },
        body: JSON.stringify(body),
    });
}

const validOrderBody = {
    fromCity: 'Москва',
    toCity: 'Санкт-Петербург',
    tariff: 'standart',
    passengers: 2,
    priceEstimate: '5000',
    customerName: 'Иванов Иван',
    customerPhone: '+79991234567',
    comments: 'Тестовый заказ',
};

describe('/api/order POST', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (prisma.order.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });
        (sendOrderNotification as ReturnType<typeof vi.fn>).mockResolvedValue(true);
        (sendEmailNotification as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    it('should create an order and return 200', async () => {
        const req = createMockRequest(validOrderBody);
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.orderId).toBe('42');
    });

    it('should call prisma.order.create with correct data', async () => {
        const req = createMockRequest(validOrderBody);
        await POST(req);

        expect(prisma.order.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                fromCity: 'Москва',
                toCity: 'Санкт-Петербург',
                tariff: 'standart',
                passengers: 2,
                customerName: 'Иванов Иван',
                customerPhone: '+79991234567',
            }),
        });
    });

    it('should send Telegram notification', async () => {
        const req = createMockRequest(validOrderBody);
        await POST(req);

        expect(sendOrderNotification).toHaveBeenCalledTimes(1);
    });

    it('should send Email notification', async () => {
        const req = createMockRequest(validOrderBody);
        await POST(req);

        expect(sendEmailNotification).toHaveBeenCalledTimes(1);
    });

    it('should still succeed when DB fails (graceful degradation)', async () => {
        (prisma.order.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB unavailable'));

        const req = createMockRequest(validOrderBody);
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.orderId).toBe('N/A');
    });

    it('should indicate telegramFallback when TG notification fails', async () => {
        (sendOrderNotification as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        const req = createMockRequest(validOrderBody);
        const res = await POST(req);
        const json = await res.json();

        expect(json.telegramFallback).toBe(true);
    });

    it('should return 500 on invalid JSON body', async () => {
        const req = new Request('http://localhost/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', host: 'xn--c1acbe2apap.com' },
            body: 'not json',
        });
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.success).toBe(false);
    });
});
