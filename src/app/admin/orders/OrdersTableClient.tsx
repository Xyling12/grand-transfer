"use client";

import React, { useState } from 'react';
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import UserDetailModal from '@/components/admin/UserDetailModal';
import OrderDetailModal from '@/components/admin/OrderDetailModal';

type FilterType = 'all' | 'processing' | 'completed';

export default function OrdersTableClient({ initialOrders }: { initialOrders: any[] }) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userModalType, setUserModalType] = useState<'driver' | 'dispatcher' | 'client'>('driver');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const translateStatus = (status: string) => {
        switch (status) {
            case 'NEW': return <span style={{ color: '#60a5fa' }}>Новая</span>;
            case 'PROCESSING': return <span style={{ color: '#fbbf24' }}>У диспетчера</span>;
            case 'DISPATCHED': return <span style={{ color: '#c084fc' }}>Поиск водителя</span>;
            case 'TAKEN': return <span style={{ color: '#818cf8' }}>У водителя</span>;
            case 'COMPLETED': return <span style={{ color: '#4ade80' }}>Выполнена</span>;
            case 'CANCELLED': return <span style={{ color: '#f87171' }}>Отменена</span>;
            default: return status;
        }
    };

    const translateTariff = (tariff: string) => {
        switch (tariff?.toLowerCase()) {
            case 'econom': return 'Эконом';
            case 'comfort': return 'Комфорт';
            case 'minivan': return 'Минивэн';
            case 'business': return 'Бизнес';
            default: return tariff;
        }
    };

    const activeCount = initialOrders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
    const completedCount = initialOrders.filter(o => o.status === 'COMPLETED').length;

    const filteredOrders = initialOrders.filter(o => {
        if (filter === 'processing') return !['COMPLETED', 'CANCELLED'].includes(o.status);
        if (filter === 'completed') return o.status === 'COMPLETED';
        return true;
    });

    return (
        <>
            {/* Dashboard Stats & Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(23,23,23,0.5)', backdropFilter: 'blur(24px)', border: '1px solid #262626', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Всего Заказов</div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 300, color: '#fff' }}>{initialOrders.length}</div>
                    </div>
                    <div style={{ background: 'rgba(23,23,23,0.5)', backdropFilter: 'blur(24px)', border: '1px solid #262626', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>В процессе</div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 300, color: '#f59e0b' }}>{activeCount}</div>
                    </div>
                    <div style={{ background: 'rgba(23,23,23,0.5)', backdropFilter: 'blur(24px)', border: '1px solid #262626', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Выполненные</div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 300, color: '#4ade80' }}>{completedCount}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #262626', background: filter === 'all' ? '#171717' : 'transparent', color: filter === 'all' ? '#fff' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Все
                    </button>
                    <button
                        onClick={() => setFilter('processing')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.3)', background: filter === 'processing' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: filter === 'processing' ? '#f59e0b' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        В процессе
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(74, 222, 128, 0.3)', background: filter === 'completed' ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: filter === 'completed' ? '#4ade80' : '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Выполненные
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div style={{ background: 'rgba(23,23,23,0.3)', border: '1px solid #262626', borderRadius: '1rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #262626', background: 'rgba(23,23,23,0.5)', color: '#9ca3af', fontSize: '0.875rem' }}>
                                <th style={{ padding: '1rem', fontWeight: 400 }}>ID / Дата</th>
                                <th style={{ padding: '1rem', fontWeight: 400 }}>Маршрут / Пассажиры</th>
                                <th style={{ padding: '1rem', fontWeight: 400 }}>Клиент</th>
                                <th style={{ padding: '1rem', fontWeight: 400 }}>Исполнители</th>
                                <th style={{ padding: '1rem', fontWeight: 400, textAlign: 'right', whiteSpace: 'nowrap' }}>Статус / Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                        Нет данных по выбранному фильтру
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((o) => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(38,38,38,0.5)', transition: 'background-color 0.2s', cursor: 'pointer' }} onClick={() => setSelectedOrder(o)} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(38,38,38,0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500, color: '#fff' }}>#{o.id}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                {format(new Date(o.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                                                <span style={{ color: '#f59e0b', fontWeight: 500 }}>{o.fromCity}</span> → <span style={{ color: '#f59e0b', fontWeight: 500 }}>{o.toCity}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                {translateTariff(o.tariff)} • {o.passengers} чел.
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>{o.customerName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{o.customerPhone}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {o.dispatcher && (
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    Дисп:{' '}
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(o.dispatcher); setUserModalType('dispatcher'); }}
                                                        style={{ color: '#d8b4fe', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer' }}
                                                    >
                                                        {o.dispatcher.fullFio || o.dispatcher.firstName}
                                                    </span>
                                                </div>
                                            )}
                                            {o.driver && (o.status === 'TAKEN' || o.status === 'COMPLETED') ? (
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                                    Вод:{' '}
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(o.driver); setUserModalType('driver'); }}
                                                        style={{ color: '#a5b4fc', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer' }}
                                                    >
                                                        {o.driver?.fullFio || o.driver?.firstName}
                                                    </span>
                                                </div>
                                            ) : o.status === 'DISPATCHED' ? (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>Идет поиск водителя...</div>
                                            ) : null}
                                            {!o.dispatcher && !o.driver && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>Свободная заявка</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                                                {translateStatus(o.status)}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                                                style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'transparent', border: '1px solid rgba(56,189,248,0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                Открыть заявку
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                data={selectedOrder}
                onUserClick={(user, type) => {
                    setSelectedOrder(null); // Optional: close order modal when opening user modal
                    setSelectedUser(user);
                    setUserModalType(type);
                }}
            />

            <UserDetailModal
                isOpen={!!selectedUser}
                onClose={() => {
                    setSelectedUser(null);
                    // If we closed order modal to open this, maybe user wants it back? Let's keep it simple for now.
                }}
                data={selectedUser}
                type={userModalType}
            />
        </>
    );
}
