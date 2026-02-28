'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DriverShell from '@/components/driver/DriverShell';

interface Order {
    id: number;
    fromCity: string;
    toCity: string;
    tariff: string;
    passengers: number;
    priceEstimate: number | null;
    customerName: string;
    customerPhone: string;
    status: string;
    createdAt: string;
    driver: { firstName: string | null; fullFio: string | null; phone: string | null } | null;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    NEW: { label: 'Новый', cls: 'status-new' },
    DISPATCHED: { label: 'Передан', cls: 'status-dispatched' },
    TAKEN: { label: 'Взят', cls: 'status-taken' },
    COMPLETED: { label: 'Выполнен', cls: 'status-completed' },
    CANCELLED: { label: 'Отменён', cls: 'status-cancelled' },
};

export default function ActiveOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/mobile/orders?filter=active');
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 15000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    const handleAction = async (orderId: number, action: string) => {
        setActionLoading(orderId);
        try {
            const res = await fetch('/api/mobile/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action }),
            });
            if (res.ok) await loadOrders();
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DriverShell>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Активные заказы</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--gt-info)' }}>
                        {orders.filter(o => o.status === 'NEW').length}
                    </div>
                    <div className="stat-label">Новых</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--gt-accent-light)' }}>
                        {orders.filter(o => o.status === 'TAKEN').length}
                    </div>
                    <div className="stat-label">В работе</div>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>Нет активных заказов</h3>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => {
                        const st = STATUS_MAP[order.status] || { label: order.status, cls: '' };
                        return (
                            <div key={order.id} className="order-card">
                                <Link href={`/driver/orders/${order.id}`} className="order-header" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <span className="order-id">№ {order.id} →</span>
                                    <span className={`order-status ${st.cls}`}>{st.label}</span>
                                </Link>
                                <div className="order-route">
                                    <div className="route-dots">
                                        <div className="route-dot" />
                                        <div className="route-line" />
                                        <div className="route-dot end" />
                                    </div>
                                    <div className="route-cities">
                                        <div className="route-city">{order.fromCity}</div>
                                        <div className="route-city">{order.toCity}</div>
                                    </div>
                                </div>
                                {order.priceEstimate && (
                                    <div className="order-price">
                                        {order.priceEstimate.toLocaleString('ru-RU')} ₽
                                    </div>
                                )}
                                {order.driver && (
                                    <div className="order-customer">
                                        🚕 {order.driver.fullFio || order.driver.firstName}
                                        {order.driver.phone && ` • ${order.driver.phone}`}
                                    </div>
                                )}
                                <div className="order-customer">
                                    👤 {order.customerName} &bull;{' '}
                                    <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                                </div>
                                <div className="order-actions">
                                    {order.status === 'NEW' && (
                                        <button
                                            className="order-btn primary"
                                            onClick={() => handleAction(order.id, 'dispatch')}
                                            disabled={actionLoading === order.id}
                                        >
                                            📤 Передать водителям
                                        </button>
                                    )}
                                    {(order.status === 'NEW' || order.status === 'DISPATCHED') && (
                                        <button
                                            className="order-btn secondary"
                                            onClick={() => handleAction(order.id, 'take')}
                                            disabled={actionLoading === order.id}
                                        >
                                            🚗 Взять
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DriverShell>
    );
}
