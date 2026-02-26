"use client";

import React from 'react';
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onUserClick: (user: any, type: 'driver' | 'dispatcher' | 'client') => void;
}

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

export default function OrderDetailModal({ isOpen, onClose, data, onUserClick }: OrderDetailModalProps) {
    if (!isOpen || !data) return null;

    const o = data;
    const mapLink = `https://yandex.ru/maps/?mode=routes&rtext=${encodeURIComponent(o.fromCity)}~${encodeURIComponent(o.toCity)}`;

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, rgba(38,38,38,0.95) 0%, rgba(23,23,23,0.95) 100%)',
                    borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '600px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative', overflowY: 'auto', maxHeight: '90vh'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                    <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>📋</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>ПОЛНАЯ ЗАЯВКА № {o.id}</h2>
                        <div style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '0.25rem' }}>
                            Создана {format(new Date(o.createdAt), 'dd.MM.yyyy, HH:mm:ss', { locale: ru })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem', lineHeight: '1.6' }}>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#ef4444', minWidth: '120px' }}>📍 Откуда:</span>
                        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{o.fromCity}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#10b981', minWidth: '120px' }}>🏁 Куда:</span>
                        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{o.toCity}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#f59e0b', minWidth: '120px' }}>🚕 Тариф:</span>
                        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{translateTariff(o.tariff)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#60a5fa', minWidth: '120px' }}>👥 Пассажиров:</span>
                        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{o.passengers}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#10b981', minWidth: '120px' }}>💰 Стоимость:</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{o.priceEstimate || '0'} ₽</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <span style={{ color: '#fcd34d', minWidth: '120px' }}>📝 Комментарий:</span>
                        <span style={{ color: '#d1d5db', fontStyle: o.comments ? 'normal' : 'italic' }}>{o.comments || 'Нет'}</span>
                    </div>

                    <div style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
                        <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', fontSize: '0.95rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderBottom: '1px dashed #38bdf8' }}
                        >
                            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            Открыть маршрут в Яндекс Картах
                        </a>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#60a5fa', minWidth: '120px' }}>👤 Клиент:</span>
                        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{o.customerName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af', minWidth: '120px' }}>📞 Телефон:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 500 }}>{o.customerPhone}</span>
                    </div>

                    <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#9ca3af', minWidth: '120px', fontSize: '0.875rem' }}>📌 Текущий Статус:</span>
                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{translateStatus(o.status)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#9ca3af', minWidth: '120px', fontSize: '0.875rem' }}>🎧 Диспетчер:</span>
                            {o.dispatcher ? (
                                <span
                                    onClick={() => onUserClick(o.dispatcher, 'dispatcher')}
                                    style={{ color: '#d8b4fe', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    {o.dispatcher.fullFio || o.dispatcher.firstName}
                                </span>
                            ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Нет</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#9ca3af', minWidth: '120px', fontSize: '0.875rem' }}>🚕 Водитель:</span>
                            {o.driver ? (
                                <span
                                    onClick={() => onUserClick(o.driver, 'driver')}
                                    style={{ color: '#a5b4fc', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    {o.driver.fullFio || o.driver.firstName}
                                </span>
                            ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{['NEW', 'PROCESSING', 'DISPATCHED'].includes(o.status) ? 'Поиск водителя...' : 'Нет'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
