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
    comments: string | null;
    status: string;
    sourceSite: string;
    scheduledDate: string | null;
    createdAt: string;
    driver: { firstName: string | null; fullFio: string | null; phone: string | null } | null;
    dispatcher: { firstName: string | null; fullFio: string | null; phone: string | null } | null;
}

const TARIFF_MAP: Record<string, string> = {
    economy: '🚙 Эконом',
    comfort: '🚕 Комфорт',
    business: '🚘 Бизнес',
    minivan: '🚐 Минивэн',
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    NEW: { label: 'Новый', cls: 'status-new' },
    DISPATCHED: { label: 'Передан', cls: 'status-dispatched' },
    TAKEN: { label: 'Взят', cls: 'status-taken' },
    COMPLETED: { label: 'Выполнен', cls: 'status-completed' },
    CANCELLED: { label: 'Отменён', cls: 'status-cancelled' },
};

export default function DriverOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState('available');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/mobile/orders?filter=${filter}`);
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (e) {
            console.error('Failed to load orders:', e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadOrders();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadOrders, 30000);
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
            if (res.ok) {
                await loadOrders();
            }
        } catch (e) {
            console.error('Action failed:', e);
        } finally {
            setActionLoading(null);
        }
    };

    const getMapLink = (from: string, to: string) =>
        `https://yandex.ru/maps/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=auto`;

    return (
        <DriverShell>
            <div className="orders-filter">
                {[
                    { key: 'available', label: '🆕 Новые' },
                    { key: 'dispatched', label: '📤 Переданные' },
                    { key: 'history', label: '📚 История' },
                ].map(f => (
                    <button
                        key={f.key}
                        className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Нет заказов</h3>
                    <p>Новые заказы появятся здесь</p>
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

                                <div className="order-details">
                                    <div className="order-detail">
                                        <span className="detail-icon">🚕</span>
                                        {TARIFF_MAP[order.tariff] || order.tariff}
                                    </div>
                                    <div className="order-detail">
                                        <span className="detail-icon">👥</span>
                                        {order.passengers} пасс.
                                    </div>
                                    {order.scheduledDate && (
                                        <div className="order-detail">
                                            <span className="detail-icon">📅</span>
                                            {order.scheduledDate}
                                        </div>
                                    )}
                                    <div className="order-detail">
                                        <span className="detail-icon">🌐</span>
                                        {order.sourceSite}
                                    </div>
                                </div>

                                {order.priceEstimate && (
                                    <div className="order-price">
                                        {order.priceEstimate.toLocaleString('ru-RU')} ₽
                                    </div>
                                )}

                                {order.comments && (
                                    <div className="order-comment">
                                        💬 {order.comments}
                                    </div>
                                )}

                                <div className="order-customer">
                                    👤 {order.customerName} &bull;{' '}
                                    <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                                </div>

                                <a
                                    href={getMapLink(order.fromCity, order.toCity)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="map-link"
                                >
                                    🗺 Открыть маршрут
                                </a>

                                <div className="order-actions">
                                    {order.status === 'NEW' || order.status === 'DISPATCHED' ? (
                                        <button
                                            className="order-btn primary"
                                            onClick={() => handleAction(order.id, 'take')}
                                            disabled={actionLoading === order.id}
                                        >
                                            {actionLoading === order.id ? '...' : '🚗 Взять'}
                                        </button>
                                    ) : null}
                                    {order.status === 'TAKEN' && (
                                        <>
                                            <button
                                                className="order-btn success"
                                                onClick={() => handleAction(order.id, 'complete')}
                                                disabled={actionLoading === order.id}
                                            >
                                                ✅ Выполнен
                                            </button>
                                            <button
                                                className="order-btn danger"
                                                onClick={() => handleAction(order.id, 'cancel')}
                                                disabled={actionLoading === order.id}
                                            >
                                                ❌ Отмена
                                            </button>
                                        </>
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
