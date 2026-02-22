"use client";

import { useState, useEffect } from 'react';
import { getDrivers, updateDriverStatus, deleteDriver } from './actions';

export default function AdminDriversPage() {
    const [pin, setPin] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const ADMIN_PIN = "7878"; // Simple hardcoded PIN for now

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
            loadDrivers();
        } else {
            alert('Неверный PIN');
        }
    };

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const data = await getDrivers();
            setDrivers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!confirm(`Изменить статус на ${newStatus}?`)) return;
        setLoading(true);
        await updateDriverStatus(id, newStatus);
        await loadDrivers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Точно удалить водителя?')) return;
        setLoading(true);
        await deleteDriver(id);
        await loadDrivers();
    };

    if (!isAuthenticated) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
                <form onSubmit={handleLogin} style={{ background: '#1c1917', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                    <h1 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Доступ в панель</h1>
                    <input
                        type="password"
                        placeholder="Введите PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', marginBottom: '20px', fontSize: '1.2rem', textAlign: 'center' }}
                        autoFocus
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Войти</button>
                </form>
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh', padding: '40px 20px', background: 'var(--color-bg)', color: '#fff' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-primary)' }}>Управление Водителями</h1>
                    <button onClick={loadDrivers} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Обновить</button>
                </div>

                {loading && <p style={{ color: 'var(--color-primary)', textAlign: 'center' }}>Загрузка...</p>}

                <div style={{ background: '#1c1917', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <tr>
                                <th style={{ padding: '20px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ID / Telegram</th>
                                <th style={{ padding: '20px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Имя / Username</th>
                                <th style={{ padding: '20px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Статус</th>
                                <th style={{ padding: '20px', fontWeight: 500, color: 'var(--color-text-muted)', textAlign: 'right' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Нет водителей в базе</td>
                                </tr>
                            )}
                            {drivers.map(driver => (
                                <tr key={driver.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{driver.id.substring(0, 8)}...</div>
                                        <div style={{ fontWeight: 600 }}>{driver.telegramId.toString()}</div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: 600 }}>{driver.firstName || '—'}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{driver.username ? `@${driver.username}` : 'Без username'}</div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: driver.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : driver.status === 'BANNED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(202, 138, 4, 0.2)',
                                            color: driver.status === 'APPROVED' ? '#4ade80' : driver.status === 'BANNED' ? '#f87171' : '#facc15'
                                        }}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {driver.status !== 'APPROVED' && (
                                                <button onClick={() => handleStatusChange(driver.id, 'APPROVED')} style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', cursor: 'pointer' }}>Одобрить</button>
                                            )}
                                            {driver.status !== 'BANNED' && (
                                                <button onClick={() => handleStatusChange(driver.id, 'BANNED')} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer' }}>Бан</button>
                                            )}
                                            <button onClick={() => handleDelete(driver.id)} style={{ padding: '8px', background: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', opacity: 0.7 }}>Удалить</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
