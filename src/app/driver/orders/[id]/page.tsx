'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DriverShell from '@/components/driver/DriverShell';

interface OrderDetail {
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
    takenAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
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
    TAKEN: { label: 'В работе', cls: 'status-taken' },
    COMPLETED: { label: 'Выполнен', cls: 'status-completed' },
    CANCELLED: { label: 'Отменён', cls: 'status-cancelled' },
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id;
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadOrder = useCallback(async () => {
        try {
            const res = await fetch(`/api/mobile/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { loadOrder(); }, [loadOrder]);

    const handleAction = async (action: string) => {
        if (!order) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/mobile/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, action }),
            });
            if (res.ok) await loadOrder();
        } finally {
            setActionLoading(false);
        }
    };

    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : null;
    const getMapLink = (from: string, to: string) =>
        `https://yandex.ru/maps/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=auto`;

    if (loading) {
        return <DriverShell><div className="loading-spinner"><div className="spinner" /></div></DriverShell>;
    }

    if (!order) {
        return (
            <DriverShell>
                <div className="empty-state">
                    <div className="empty-icon">❌</div>
                    <h3>Заказ не найден</h3>
                    <button className="auth-btn" onClick={() => router.back()}>← Назад</button>
                </div>
            </DriverShell>
        );
    }

    const st = STATUS_MAP[order.status] || { label: order.status, cls: '' };

    return (
        <DriverShell>
            <div style={{ marginBottom: 12 }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'none', border: 'none', color: 'var(--gt-accent-light)',
                        fontSize: 14, cursor: 'pointer', padding: 0
                    }}
                >
                    ← Назад
                </button>
            </div>

            <div className="order-card" style={{ animation: 'none' }}>
                <div className="order-header">
                    <span className="order-id" style={{ fontSize: 16 }}>Заявка № {order.id}</span>
                    <span className={`order-status ${st.cls}`}>{st.label}</span>
                </div>

                {/* Route */}
                <div className="order-route" style={{ marginBottom: 16 }}>
                    <div className="route-dots">
                        <div className="route-dot" />
                        <div className="route-line" />
                        <div className="route-dot end" />
                    </div>
                    <div className="route-cities">
                        <div className="route-city" style={{ fontSize: 18 }}>{order.fromCity}</div>
                        <div className="route-city" style={{ fontSize: 18 }}>{order.toCity}</div>
                    </div>
                </div>

                <a
                    href={getMapLink(order.fromCity, order.toCity)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                    style={{ fontSize: 15, marginBottom: 16, display: 'block' }}
                >
                    🗺 Открыть маршрут в Яндекс Картах
                </a>

                {/* Price */}
                {order.priceEstimate && (
                    <div className="order-price" style={{ fontSize: 24 }}>
                        {order.priceEstimate.toLocaleString('ru-RU')} ₽
                    </div>
                )}

                {/* Details */}
                <div className="profile-card" style={{ marginBottom: 16 }}>
                    <div className="profile-fields">
                        <div className="profile-field">
                            <span className="profile-label">🚕 Тариф</span>
                            <span className="profile-value">{TARIFF_MAP[order.tariff] || order.tariff}</span>
                        </div>
                        <div className="profile-field">
                            <span className="profile-label">👥 Пассажиров</span>
                            <span className="profile-value">{order.passengers}</span>
                        </div>
                        <div className="profile-field">
                            <span className="profile-label">🌐 Источник</span>
                            <span className="profile-value">{order.sourceSite}</span>
                        </div>
                        {order.scheduledDate && (
                            <div className="profile-field">
                                <span className="profile-label">📅 Дата поездки</span>
                                <span className="profile-value">{order.scheduledDate}</span>
                            </div>
                        )}
                        <div className="profile-field">
                            <span className="profile-label">🕐 Создан</span>
                            <span className="profile-value">{fmtDate(order.createdAt)}</span>
                        </div>
                        {order.takenAt && (
                            <div className="profile-field">
                                <span className="profile-label">⏱ Взят</span>
                                <span className="profile-value">{fmtDate(order.takenAt)}</span>
                            </div>
                        )}
                        {order.completedAt && (
                            <div className="profile-field">
                                <span className="profile-label">✅ Завершён</span>
                                <span className="profile-value">{fmtDate(order.completedAt)}</span>
                            </div>
                        )}
                        {order.cancelledAt && (
                            <div className="profile-field">
                                <span className="profile-label">❌ Отменён</span>
                                <span className="profile-value">{fmtDate(order.cancelledAt)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comment */}
                {order.comments && (
                    <div className="order-comment" style={{ fontSize: 14, marginBottom: 16 }}>
                        💬 <strong>Комментарий:</strong> {order.comments}
                    </div>
                )}

                {order.cancelReason && (
                    <div className="order-comment" style={{ background: 'var(--gt-danger-bg)', marginBottom: 16 }}>
                        ❌ <strong>Причина отмены:</strong> {order.cancelReason}
                    </div>
                )}

                {/* Customer */}
                <div className="profile-card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, color: 'var(--gt-text-muted)', marginBottom: 10 }}>КЛИЕНТ</h3>
                    <div className="profile-fields">
                        <div className="profile-field">
                            <span className="profile-label">👤 Имя</span>
                            <span className="profile-value">{order.customerName}</span>
                        </div>
                        <div className="profile-field">
                            <span className="profile-label">📞 Телефон</span>
                            <a href={`tel:${order.customerPhone}`} className="profile-value" style={{ color: 'var(--gt-accent-light)' }}>
                                {order.customerPhone}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Driver / Dispatcher */}
                {(order.driver || order.dispatcher) && (
                    <div className="profile-card" style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, color: 'var(--gt-text-muted)', marginBottom: 10 }}>ИСПОЛНИТЕЛЬ</h3>
                        <div className="profile-fields">
                            {order.driver && (
                                <div className="profile-field">
                                    <span className="profile-label">🚕 Водитель</span>
                                    <span className="profile-value">
                                        {order.driver.fullFio || order.driver.firstName}
                                        {order.driver.phone && ` • ${order.driver.phone}`}
                                    </span>
                                </div>
                            )}
                            {order.dispatcher && (
                                <div className="profile-field">
                                    <span className="profile-label">🎧 Диспетчер</span>
                                    <span className="profile-value">
                                        {order.dispatcher.fullFio || order.dispatcher.firstName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="order-actions" style={{ marginTop: 8 }}>
                    {(order.status === 'NEW' || order.status === 'DISPATCHED') && (
                        <button
                            className="order-btn primary"
                            onClick={() => handleAction('take')}
                            disabled={actionLoading}
                        >
                            🚗 Взять заказ
                        </button>
                    )}
                    {order.status === 'TAKEN' && (
                        <>
                            <button
                                className="order-btn success"
                                onClick={() => handleAction('complete')}
                                disabled={actionLoading}
                            >
                                ✅ Выполнен
                            </button>
                            <button
                                className="order-btn danger"
                                onClick={() => handleAction('cancel')}
                                disabled={actionLoading}
                            >
                                ❌ Отмена
                            </button>
                        </>
                    )}
                </div>
            </div>
        </DriverShell>
    );
}
