import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // Counters
    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const activeOrders = await prisma.order.count({ where: { status: { in: ['NEW', 'DISPATCHED', 'PROCESSING', 'TAKEN'] } } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });
    const totalDrivers = await prisma.driver.count({ where: { status: 'APPROVED' } });
    const pendingDrivers = await prisma.driver.count({ where: { status: 'PENDING' } });
    const revenueResult = await prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { priceEstimate: true } });
    const revenue = revenueResult._sum.priceEstimate || 0;

    // Today's counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.order.count({ where: { createdAt: { gte: todayStart } } });
    const todayCompleted = await prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: todayStart } } });

    // Recent orders
    const recentOrders = (await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { driver: true, dispatcher: true }
    })) as any[];

    // Recent audit log
    let auditLogs: any[] = [];
    try {
        auditLogs = await (prisma as any).auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    } catch (e) { /* AuditLog may not exist yet */ }

    const statusLabels: Record<string, string> = {
        NEW: '🔵 Новая', DISPATCHED: '🟡 Отправлена', PROCESSING: '🟣 В обработке',
        TAKEN: '🟢 Взята', COMPLETED: '✅ Выполнена', CANCELLED: '❌ Отменена'
    };

    const cardStyle = (bg: string) => ({
        background: bg,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.25rem'
    });

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-body)', padding: '1.5rem' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>📊 Dashboard</h1>
                        <p style={{ color: '#9ca3af', marginTop: '0.25rem' }}>Обзор сервиса Grand Transfer</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link href="/admin/drivers" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none' }}>
                            👥 Водители
                        </Link>
                        <Link href="/admin/orders" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none' }}>
                            📋 Заказы
                        </Link>
                        <Link href="/admin/clients" style={{ padding: '0.5rem 1rem', background: '#171717', border: '1px solid #262626', borderRadius: '0.5rem', color: '#fff', textDecoration: 'none' }}>
                            👤 Клиенты
                        </Link>
                    </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={cardStyle('#171717')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>📋 Всего заявок</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{totalOrders}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Сегодня: +{todayOrders}</span>
                    </div>
                    <div style={cardStyle('#0f1a0f')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>✅ Выполнено</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{completedOrders}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Сегодня: +{todayCompleted}</span>
                    </div>
                    <div style={cardStyle('#1a1a0f')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>🔄 В работе</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#eab308' }}>{activeOrders}</span>
                    </div>
                    <div style={cardStyle('#1a0f0f')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>❌ Отменено</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{cancelledOrders}</span>
                    </div>
                    <div style={cardStyle('#0f0f1a')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>💰 Выручка</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa' }}>{revenue.toLocaleString('ru-RU')} ₽</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Выполненные заказы</span>
                    </div>
                    <div style={cardStyle('#171717')}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>👥 Водители</span>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{totalDrivers}</span>
                        <span style={{ fontSize: '0.75rem', color: pendingDrivers > 0 ? '#eab308' : '#6b7280' }}>
                            {pendingDrivers > 0 ? `⏳ Ожидают: ${pendingDrivers}` : 'Нет ожидающих'}
                        </span>
                    </div>
                </div>

                {/* Recent Orders */}
                <div style={{ background: '#171717', borderRadius: '0.75rem', border: '1px solid #262626', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>📝 Последние заявки</h2>
                        <Link href="/admin/orders" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>Все заявки →</Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #262626', color: '#9ca3af' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>№</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Дата</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Маршрут</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Клиент</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Сумма</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Статус</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Исполнитель</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((o: any) => {
                                    const driver = o.driver ? (o.driver.username ? `@${o.driver.username}` : o.driver.firstName) : (o.dispatcher ? (o.dispatcher.username ? `@${o.dispatcher.username}` : o.dispatcher.firstName) : '—');
                                    return (
                                        <tr key={o.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{o.id}</td>
                                            <td style={{ padding: '0.75rem', color: '#9ca3af' }}>{new Date(o.createdAt).toLocaleString('ru-RU')}</td>
                                            <td style={{ padding: '0.75rem' }}>{o.fromCity} → {o.toCity}</td>
                                            <td style={{ padding: '0.75rem' }}>{o.customerName}</td>
                                            <td style={{ padding: '0.75rem', color: '#a78bfa' }}>{o.priceEstimate ? `${o.priceEstimate} ₽` : '—'}</td>
                                            <td style={{ padding: '0.75rem' }}>{statusLabels[o.status] || o.status}</td>
                                            <td style={{ padding: '0.75rem', color: '#9ca3af' }}>{driver}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Log */}
                {auditLogs.length > 0 && (
                    <div style={{ background: '#171717', borderRadius: '0.75rem', border: '1px solid #262626', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #262626' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>📜 Журнал действий</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #262626', color: '#9ca3af' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Дата</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Действие</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Актор</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Цель</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Детали</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((l: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #1f1f1f' }}>
                                            <td style={{ padding: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('ru-RU')}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{l.action}</td>
                                            <td style={{ padding: '0.75rem' }}>{l.actorName}</td>
                                            <td style={{ padding: '0.75rem' }}>{l.targetName || l.targetId || '—'}</td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>{l.details || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
