"use client";

import React from 'react';

type UserDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    data: any; // User (Driver/Dispatcher) or Client
    type: 'driver' | 'dispatcher' | 'client';
    onUpdateFeedback?: (orderId: number, currentVal: boolean) => void;
    onOpenOrder?: (orderId: number) => void;
};

export default function UserDetailModal({ isOpen, onClose, data, type, onUpdateFeedback, onOpenOrder }: UserDetailModalProps) {
    if (!isOpen || !data) return null;

    const renderDocs = () => {
        if (type !== 'driver') return null;

        const docs = [
            { type: 'ptsNumber', icon: '📄', title: 'ПТС', id: data.ptsNumber },
            { type: 'stsPhotoId', icon: '🪪', title: 'СТС', id: data.stsPhotoId },
            { type: 'licensePhotoId', icon: '🎫', title: 'Права', id: data.licensePhotoId },
            { type: 'carPhotoId', icon: '🚙', title: 'Авто', id: data.carPhotoId }
        ];

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {docs.map((doc, idx) => {
                    if (doc.id) {
                        const isText = doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length < 50;
                        return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <a href={isText ? undefined : `/api/tg-file/${doc.id}`} target="_blank" rel="noopener noreferrer"
                                    title={`${doc.title} (${doc.id})`}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid rgba(245, 158, 11, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.25rem', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(202,138,4,0.1)',
                                        cursor: isText ? 'help' : 'pointer'
                                    }}
                                    onClick={(e) => {
                                        if (isText) {
                                            e.preventDefault();
                                            alert(`Номер ПТС: ${doc.id}`);
                                        }
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'none'; }}
                                >
                                    {doc.icon}
                                </a>
                                <span style={{ fontSize: '10px', color: '#f59e0b', opacity: 0.8, textTransform: 'uppercase' }}>{doc.title}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div title={`Нет ${doc.title}`} style={{
                                width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)',
                                border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0.3, filter: 'grayscale(100%)'
                            }}>
                                {doc.icon}
                            </div>
                            <span style={{ fontSize: '10px', color: '#9ca3af', opacity: 0.5, textTransform: 'uppercase' }}>{doc.title}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const orders = type === 'driver' ? data.ordersAsDriver : (type === 'dispatcher' ? data.ordersAsDispatcher : data.orders);
    const activeStatuses = type === 'driver' ? ['TAKEN'] : (type === 'dispatcher' ? ['DISPATCHED', 'PROCESSING'] : ['NEW', 'DISPATCHED', 'PROCESSING', 'TAKEN']);

    // Sort orders: active first, then by date descending
    const sortedOrders = [...(orders || [])].sort((a: any, b: any) => {
        const aActive = activeStatuses.includes(a.status);
        const bActive = activeStatuses.includes(b.status);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const activeOrder = sortedOrders.find((o: any) => activeStatuses.includes(o.status));
    const completedOrders = sortedOrders.filter((o: any) => o.status === 'COMPLETED');

    const renderOrders = () => {
        if (!sortedOrders || sortedOrders.length === 0) {
            return <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>Нет истории заказов</div>;
        }

        return (
            <div style={{ marginTop: '1.5rem', maxHeight: '40vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1rem', position: 'sticky', top: 0, background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '0.5rem 0', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    История заказов ({sortedOrders.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sortedOrders.map((o: any) => {
                        const isActive = activeStatuses.includes(o.status);
                        const orderLink = `/admin/orders`;

                        return (
                            <div key={o.id} style={{
                                padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer',
                                border: isActive ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                                transition: 'all 0.2s'
                            }}
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    if (onOpenOrder) {
                                        onOpenOrder(o.id);
                                    } else {
                                        window.location.href = orderLink;
                                    }
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ fontWeight: 500, color: 'var(--color-foreground)', margin: 0 }}>Заказ #{o.id}</h4>
                                        {isActive && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 700, background: 'var(--color-primary)', color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Текущий</span>}
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px',
                                        background: o.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : o.status === 'NEW' ? 'rgba(56, 189, 248, 0.2)' : o.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: o.status === 'COMPLETED' ? '#4ade80' : o.status === 'NEW' ? '#38bdf8' : o.status === 'CANCELLED' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {o.status === 'COMPLETED' ? 'ВЫПОЛНЕН' : o.status === 'CANCELLED' ? 'ОТМЕНЕН' : o.status === 'NEW' ? 'НОВЫЙ' : 'В ПРОЦЕССЕ'}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                    {new Date(o.createdAt).toLocaleDateString('ru-RU')} • <span style={{ color: '#60a5fa' }}>{o.fromCity} &rarr; {o.toCity}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                                    <div style={{ color: '#9ca3af' }}>
                                        {o.priceEstimate ? `${o.priceEstimate} ₽` : 'Цена не указана'}
                                    </div>

                                    {type === 'client' && o.status === 'COMPLETED' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ОС:</span>
                                            <button
                                                onClick={() => onUpdateFeedback && onUpdateFeedback(o.id, !!o.feedbackReceived)}
                                                style={{
                                                    position: 'relative', display: 'inline-flex', height: '1.25rem', width: '2.25rem', flexShrink: 0, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px',
                                                    border: o.feedbackReceived ? '2px solid #22c55e' : '2px solid #4b5563',
                                                    background: o.feedbackReceived ? 'rgba(34, 197, 94, 0.2)' : '#1f2937',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{
                                                    pointerEvents: 'none', display: 'block', height: '0.75rem', width: '0.75rem', borderRadius: '9999px', background: o.feedbackReceived ? '#22c55e' : '#9ca3af',
                                                    transform: o.feedbackReceived ? 'translateX(0.5rem)' : 'translateX(-0.5rem)', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                }} />
                                            </button>
                                        </div>
                                    )}


                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '1rem', paddingBottom: '5rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={onClose}></div>

            <div style={{
                position: 'relative', width: '100%', maxWidth: '42rem', background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
            }}>

                {/* Header Profile Area */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '4rem', height: '4rem', borderRadius: '9999px', background: 'linear-gradient(to top right, #d97706, #facc15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#000', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)'
                        }}>
                            {data.firstName?.charAt(0) || data.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)', margin: 0 }}>{data.fullFio || data.firstName || data.name || "Без имени"}</h2>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {data.phone || 'Нет телефона'}
                                </span>
                                {data.username && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#60a5fa' }}>
                                        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                        @{data.username}
                                    </span>
                                )}
                            </div>

                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.1)', color: '#d1d5db', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                                    {type === 'driver' ? 'Водитель' : type === 'dispatcher' ? 'Диспетчер' : 'Клиент'}
                                </span>
                                {type !== 'client' && (
                                    <span style={{
                                        fontSize: '0.625rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em',
                                        background: data.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : data.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: data.status === 'APPROVED' ? '#4ade80' : data.status === 'PENDING' ? '#f59e0b' : '#f87171'
                                    }}>
                                        {data.status === 'APPROVED' ? 'ОДОБРЕН' : data.status === 'PENDING' ? 'В ОЖИДАНИИ' : 'ЗАБЛОКИРОВАН'}
                                    </span>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                {data.telegramId && (
                                    <a href={data.username ? `https://t.me/${data.username}` : data.phone ? `https://t.me/+${data.phone.replace(/[^0-9]/g, '')}` : `tg://user?id=${data.telegramId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#38bdf8', textDecoration: 'none', transition: 'background-color 0.2s', border: '1px solid rgba(56, 189, 248, 0.2)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}>
                                        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.07.01.22 0 .38z" /></svg>
                                        Написать в Telegram
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ color: '#9ca3af', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', padding: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ padding: '1.5rem' }}>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.75rem', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Всего заказов</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>{sortedOrders.length}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.75rem', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Завершено</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4ade80' }}>{completedOrders.length}</div>
                        </div>
                        {type === 'client' && (
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.75rem', gridColumn: 'span 4' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Сумма всех поездок</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>{data.totalSpent || 0} ₽</div>
                            </div>
                        )}
                        {type !== 'client' && (
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.75rem', gridColumn: 'span 4' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Регистрация</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db', marginTop: '0.25rem' }}>{new Date(data.createdAt).toLocaleDateString('ru-RU')}</div>
                            </div>
                        )}
                    </div>

                    {renderDocs()}
                    {renderOrders()}
                </div>
            </div>
            {/* Added a tiny style block to ensure animations still work simply */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
