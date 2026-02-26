"use client";

import React, { useState } from 'react';
import Link from 'next/link';

type TabType = 'pending' | 'drivers' | 'dispatchers' | 'clients';

export default function CrmDashboardClient({ users, clientsMap }: { users: any[], clientsMap: any[] }) {
    const [activeTab, setActiveTab] = useState<TabType>('pending');

    const pendingUsers = users.filter((u: any) => u.status === 'PENDING');
    const approvedDrivers = users.filter((u: any) => u.status === 'APPROVED' && u.role === 'DRIVER');
    const approvedDispatchers = users.filter((u: any) => u.status === 'APPROVED' && (u.role === 'DISPATCHER' || u.role === 'ADMIN'));

    const roleTranslations: Record<string, string> = {
        'DRIVER': 'Водитель',
        'DISPATCHER': 'Диспетчер',
        'ADMIN': 'Админ',
        'USER': 'Пользователь'
    };

    const statusTranslations: Record<string, string> = {
        'PENDING': 'Ожидает',
        'APPROVED': 'Подтвержден',
        'BANNED': 'Блок'
    };

    const renderUserTable = (data: any[], emptyMessage: string, showFiles: boolean = true) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            {data.length === 0 ? (
                <div style={{
                    background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-xl)'
                }}>
                    {emptyMessage}
                </div>
            ) : (
                data.map((d: any, i: number) => {
                    // Normalize the document IDs for this user
                    const docs = [
                        { type: 'ptsNumber', icon: '📄', title: 'ПТС', id: d.ptsNumber },
                        { type: 'stsPhotoId', icon: '🪪', title: 'СТС', id: d.stsPhotoId },
                        { type: 'licensePhotoId', icon: '🎫', title: 'Права', id: d.licensePhotoId },
                        { type: 'carPhotoId', icon: '🚙', title: 'Авто', id: d.carPhotoId }
                    ];

                    return (
                        <div key={i} style={{
                            background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '1rem',
                            display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: 'var(--shadow-card)', transition: 'transform 0.2s', cursor: 'default'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            {/* Header: User Info */}
                            <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                                <div style={{ fontWeight: '600', color: 'var(--color-foreground)', fontSize: '1.05rem', marginBottom: '4px' }}>
                                    {d.fullFio || d.firstName || "Без имени"}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span>{d.username ? `@${d.username}` : `ID: ${d.telegramId}`}</span>
                                    <span>{d.phone || 'Телефон не указан'}</span>
                                </div>
                            </div>

                            {/* Middle: Role & Status */}
                            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                <span style={{
                                    fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase',
                                    background: d.role === 'ADMIN' ? 'rgba(202, 138, 4, 0.1)' : d.role === 'DISPATCHER' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: d.role === 'ADMIN' ? 'var(--color-primary)' : d.role === 'DISPATCHER' ? '#c084fc' : 'var(--color-text-muted)',
                                    border: d.role === 'ADMIN' ? '1px solid rgba(202, 138, 4, 0.2)' : d.role === 'DISPATCHER' ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid var(--glass-border)'
                                }}>
                                    {roleTranslations[d.role] || d.role}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase',
                                    color: d.status === 'APPROVED' ? '#4ade80' : d.status === 'PENDING' ? '#fbbf24' : '#f87171',
                                    background: d.status === 'APPROVED' ? 'rgba(74, 222, 128, 0.1)' : d.status === 'PENDING' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(248, 113, 113, 0.1)'
                                }}>
                                    {statusTranslations[d.status] || d.status}
                                </span>
                            </div>

                            {/* Right: Files */}
                            {showFiles && (
                                <div style={{ flex: '1 1 100px', display: 'flex', justifyContent: 'flex-start', gap: '6px', flexWrap: 'wrap' }}>
                                    {docs.map((doc, idx) => {
                                        if (doc.id) {
                                            // Handle case where PTS is a photo ID vs string number
                                            let iconTitle = doc.title;
                                            if (doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length > 5 && doc.id.length < 50) {
                                                iconTitle = 'Номер ПТС';
                                            }

                                            return (
                                                <a key={idx} href={doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length < 50 ? undefined : `/api/tg-file/${doc.id}`} target="_blank" rel="noopener noreferrer"
                                                    title={`${iconTitle} (${doc.id})`}
                                                    style={{
                                                        width: '32px', height: '32px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px',
                                                        textDecoration: 'none', transition: 'all 0.2s', border: '1px solid var(--color-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 0 10px rgba(202, 138, 4, 0.1)', cursor: (doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length < 50) ? 'help' : 'pointer'
                                                    }}
                                                    onClick={(e) => {
                                                        if (doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length < 50) {
                                                            e.preventDefault();
                                                            alert(`Номер ПТС: ${doc.id}`);
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(202, 138, 4, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'none'; }}
                                                >
                                                    <span style={{ fontSize: '1rem' }}>{doc.icon}</span>
                                                </a>
                                            );
                                        }
                                        return (
                                            <div key={idx} title={`Нет ${doc.title}`} style={{
                                                width: '32px', height: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3
                                            }}>
                                                <span style={{ fontSize: '1rem', filter: 'grayscale(1)' }}>{doc.icon}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderClientsTable = () => (
        <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            marginTop: '1.5rem'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Имя</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Телефон</th>
                            <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'center' }}>Кол-во заказов</th>
                            <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'right' }}>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientsMap.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Нет данных о клиентах
                                </td>
                            </tr>
                        ) : (
                            clientsMap.map((c: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-foreground)' }}>{c.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{c.phone}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                                            {c.ordersCount}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '500' }}>
                                        {c.totalSpent > 0 ? `${c.totalSpent} ₽` : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div style={{ fontFamily: 'var(--font-body)', maxWidth: '1200px', margin: '0 auto', paddingTop: '2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: 0 }} className="gold-text">
                        Управление CRM
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        Единый реестр пользователей
                    </p>
                </div>
                <div>
                    <Link href="/" style={{
                        padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)', color: 'var(--color-foreground)', textDecoration: 'none',
                        fontSize: '0.9rem', transition: 'background 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}>
                        На сайт &rarr;
                    </Link>
                </div>
            </div>

            {/* Custom Tab Bar */}
            <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
                borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem',
                scrollbarWidth: 'none' // hide scrollbar for firefox
            }}>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none', outline: 'none', cursor: 'pointer',
                        background: activeTab === 'pending' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'pending' ? '#000' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'pending' ? '600' : '500',
                        transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    Новые {pendingUsers.length > 0 && <span style={{ background: activeTab === 'pending' ? 'rgba(0,0,0,0.2)' : 'rgba(239,68,68,0.2)', color: activeTab === 'pending' ? '#000' : '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{pendingUsers.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('drivers')}
                    style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none', outline: 'none', cursor: 'pointer',
                        background: activeTab === 'drivers' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'drivers' ? '#000' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'drivers' ? '600' : '500',
                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                >
                    Водители ({approvedDrivers.length})
                </button>
                <button
                    onClick={() => setActiveTab('dispatchers')}
                    style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none', outline: 'none', cursor: 'pointer',
                        background: activeTab === 'dispatchers' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'dispatchers' ? '#000' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'dispatchers' ? '600' : '500',
                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                >
                    Диспетчеры ({approvedDispatchers.length})
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none', outline: 'none', cursor: 'pointer',
                        background: activeTab === 'clients' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'clients' ? '#000' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'clients' ? '600' : '500',
                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                >
                    Клиенты ({clientsMap.length})
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'pending' && renderUserTable(pendingUsers, "Нет заявок ожидающих проверки")}
                {activeTab === 'drivers' && renderUserTable(approvedDrivers, "Нет активных водителей")}
                {activeTab === 'dispatchers' && renderUserTable(approvedDispatchers, "Нет активных диспетчеров", false)}
                {activeTab === 'clients' && renderClientsTable()}
            </div>

            <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Лицензии и документы сохраняются в Telegram. При нажатии на иконку они скачиваются автоматически.
            </p>
        </div>
    );
}
