"use client";

import React, { useState } from 'react';
import UserDetailModal from '@/components/admin/UserDetailModal';

export default function ClientsTableClient({ clients }: { clients: any[] }) {
    const [selectedClient, setSelectedClient] = useState<any>(null);

    return (
        <div style={{ background: 'rgba(23,23,23,0.3)', border: '1px solid rgba(38,38,38,1)', borderRadius: '1rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(38,38,38,1)', background: 'rgba(23,23,23,0.5)', color: '#9ca3af', fontSize: '0.875rem' }}>
                            <th style={{ padding: '1rem', fontWeight: 400 }}>Имя</th>
                            <th style={{ padding: '1rem', fontWeight: 400 }}>Телефон</th>
                            <th style={{ padding: '1rem', fontWeight: 400, textAlign: 'center' }}>Кол-во поездок</th>
                            <th style={{ padding: '1rem', fontWeight: 400, textAlign: 'center' }}>Сумма поездок</th>
                            <th style={{ padding: '1rem', fontWeight: 400, textAlign: 'right' }}>Последний заказ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    Нет данных о клиентах
                                </td>
                            </tr>
                        ) : (
                            clients.map((c, i) => (
                                <tr
                                    key={i}
                                    style={{ borderBottom: '1px solid rgba(38,38,38,0.5)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(38,38,38,0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    onClick={() => setSelectedClient(c)}
                                >
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500, color: '#fff' }}>{c.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#d1d5db' }}>{c.phone}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#262626', width: '2rem', height: '2rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                                            {c.ordersCount}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#f59e0b', fontWeight: 500 }}>
                                        {c.totalSpent > 0 ? c.totalSpent + " ₽" : "-"}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: '#9ca3af' }}>
                                        {new Date(c.lastOrder).toLocaleDateString("ru-RU")}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <UserDetailModal
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                data={selectedClient}
                type="client"
                onUpdateFeedback={async (orderId, currentVal) => {
                    try {
                        const newVal = !currentVal;
                        setSelectedClient({
                            ...selectedClient,
                            orders: selectedClient.orders.map((o: any) => o.id === orderId ? { ...o, feedbackReceived: newVal } : o)
                        });
                    } catch (e) {
                        console.error('Failed to update feedback state');
                    }
                }}
            />
        </div>
    );
}
