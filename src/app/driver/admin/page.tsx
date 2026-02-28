'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DriverShell from '@/components/driver/DriverShell';

interface User {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    fullFio: string | null;
    phone: string | null;
    role: string;
    status: string;
    ptsNumber: string | null;
    carDescription: string | null;
    createdAt: string;
    ordersCount: number;
    dispatchCount: number;
}

const ROLE_LABELS: Record<string, string> = {
    DRIVER: '🚕 Водитель',
    DISPATCHER: '🎧 Диспетчер',
    ADMIN: '👑 Админ',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: '⏳ Ожидает', color: 'var(--gt-warning)' },
    APPROVED: { label: '✅ Активен', color: 'var(--gt-success)' },
    BANNED: { label: '🚫 Заблокирован', color: 'var(--gt-danger)' },
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/mobile/admin/users?filter=${filter}`);
            if (res.status === 403) {
                router.push('/driver/orders');
                return;
            }
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filter, router]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleAction = async (userId: string, action: string, role?: string) => {
        setActionLoading(userId);
        try {
            await fetch('/api/mobile/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, role }),
            });
            await loadUsers();
        } finally {
            setActionLoading(null);
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

    return (
        <DriverShell>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>👥 Управление пользователями</h2>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--gt-warning)', fontSize: 22 }}>
                        {users.filter(u => u.status === 'PENDING').length || '—'}
                    </div>
                    <div className="stat-label">Ожидают</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--gt-success)', fontSize: 22 }}>
                        {users.filter(u => u.status === 'APPROVED').length}
                    </div>
                    <div className="stat-label">Активных</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--gt-text-secondary)', fontSize: 22 }}>
                        {users.length}
                    </div>
                    <div className="stat-label">Всего</div>
                </div>
            </div>

            {/* Filter */}
            <div className="orders-filter">
                {[
                    { key: 'all', label: '📋 Все' },
                    { key: 'pending', label: '⏳ Ожидают' },
                    { key: 'approved', label: '✅ Активные' },
                    { key: 'banned', label: '🚫 Бан' },
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
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Нет пользователей</h3>
                </div>
            ) : (
                <div className="orders-list">
                    {users.map(user => {
                        const st = STATUS_LABELS[user.status] || { label: user.status, color: 'inherit' };
                        const isExpanded = expandedUser === user.id;
                        return (
                            <div key={user.id} className="order-card">
                                <div
                                    className="order-header"
                                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="order-id">
                                        {isExpanded ? '▼' : '▶'} {user.fullFio || user.firstName || 'Без имени'}
                                    </span>
                                    <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>
                                        {st.label}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--gt-text-muted)' }}>
                                        {ROLE_LABELS[user.role] || user.role}
                                    </span>
                                    {user.phone && (
                                        <span style={{ fontSize: 12, color: 'var(--gt-text-secondary)' }}>
                                            📞 {user.phone}
                                        </span>
                                    )}
                                    <span style={{ fontSize: 12, color: 'var(--gt-text-muted)' }}>
                                        📅 {fmtDate(user.createdAt)}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div style={{ paddingTop: 8, borderTop: '1px solid var(--gt-border)' }}>
                                        <div className="profile-fields">
                                            <div className="profile-field">
                                                <span className="profile-label">👤 ФИО</span>
                                                <span className="profile-value">{user.fullFio || '—'}</span>
                                            </div>
                                            <div className="profile-field">
                                                <span className="profile-label">📞 Телефон</span>
                                                <span className="profile-value">
                                                    {user.phone ? <a href={`tel:${user.phone}`} style={{ color: 'var(--gt-accent-light)' }}>{user.phone}</a> : '—'}
                                                </span>
                                            </div>
                                            <div className="profile-field">
                                                <span className="profile-label">📱 Telegram</span>
                                                <span className="profile-value">
                                                    {user.telegramId !== '0' ? `ID: ${user.telegramId}` : 'Через приложение'}
                                                    {user.username && ` (@${user.username})`}
                                                </span>
                                            </div>
                                            {user.ptsNumber && (
                                                <div className="profile-field">
                                                    <span className="profile-label">📄 ПТС</span>
                                                    <span className="profile-value">{user.ptsNumber}</span>
                                                </div>
                                            )}
                                            {user.carDescription && (
                                                <div className="profile-field">
                                                    <span className="profile-label">🚗 Авто</span>
                                                    <span className="profile-value">{user.carDescription}</span>
                                                </div>
                                            )}
                                            <div className="profile-field">
                                                <span className="profile-label">📋 Заказов</span>
                                                <span className="profile-value">{user.ordersCount}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="order-actions" style={{ marginTop: 12 }}>
                                            {user.status === 'PENDING' && (
                                                <button
                                                    className="order-btn success"
                                                    onClick={() => handleAction(user.id, 'approve')}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    ✅ Одобрить
                                                </button>
                                            )}
                                            {user.status === 'APPROVED' && (
                                                <button
                                                    className="order-btn danger"
                                                    onClick={() => handleAction(user.id, 'ban')}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    🚫 Бан
                                                </button>
                                            )}
                                            {user.status === 'BANNED' && (
                                                <button
                                                    className="order-btn primary"
                                                    onClick={() => handleAction(user.id, 'unban')}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    🔓 Разбан
                                                </button>
                                            )}
                                        </div>

                                        {/* Role change */}
                                        <div style={{ marginTop: 10 }}>
                                            <span style={{ fontSize: 12, color: 'var(--gt-text-muted)', marginRight: 8 }}>Сменить роль:</span>
                                            {['DRIVER', 'DISPATCHER', 'ADMIN'].map(r => (
                                                <button
                                                    key={r}
                                                    className={`filter-chip ${user.role === r ? 'active' : ''}`}
                                                    style={{ fontSize: 11, padding: '4px 10px', marginRight: 4 }}
                                                    onClick={() => user.role !== r && handleAction(user.id, 'set_role', r)}
                                                    disabled={user.role === r || actionLoading === user.id}
                                                >
                                                    {ROLE_LABELS[r]}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Delete */}
                                        <button
                                            className="order-btn danger"
                                            style={{ marginTop: 10, width: '100%', fontSize: 12 }}
                                            onClick={() => {
                                                if (confirm(`Удалить ${user.fullFio || user.firstName}?`)) {
                                                    handleAction(user.id, 'delete');
                                                }
                                            }}
                                            disabled={actionLoading === user.id}
                                        >
                                            🗑 Удалить пользователя
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </DriverShell>
    );
}
