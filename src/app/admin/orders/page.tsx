import { PrismaClient } from "@prisma/client";
import Link from 'next/link';
import OrdersTableClient from './OrdersTableClient';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const rawOrders = (await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        // @ts-ignore
        include: {
            driver: true,
            dispatcher: true
        }
    })) as any[];

    const orders = rawOrders.map(o => ({
        ...o,
        driver: o.driver ? { ...o.driver, telegramId: o.driver.telegramId.toString() } : null,
        dispatcher: o.dispatcher ? { ...o.dispatcher, telegramId: o.dispatcher.telegramId.toString() } : null,
    }));



    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-body)', padding: '1.5rem' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header & Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', ...(true /* mock md:flex-row fallback */ ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } : {}) }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>Доска Заказов</h1>
                        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Мониторинг всех заявок и исполнителей</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href="/admin/drivers" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}>
                            Водители
                        </Link>
                        <Link href="/admin/clients" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}>
                            Клиенты
                        </Link>
                        <Link href="/" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}>
                            На сайт
                        </Link>
                    </div>
                </div>

                <OrdersTableClient initialOrders={orders} />

            </div>
        </div>
    );
}
