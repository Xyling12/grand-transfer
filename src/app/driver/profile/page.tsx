'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverShell from '@/components/driver/DriverShell';

interface DriverProfile {
    id: string;
    fullFio: string | null;
    firstName: string | null;
    phone: string | null;
    role: string;
    status: string;
    ptsNumber: string | null;
    carDescription: string | null;
}

const ROLE_LABELS: Record<string, string> = {
    DRIVER: '🚕 Водитель',
    DISPATCHER: '🎧 Диспетчер',
    ADMIN: '👑 Администратор',
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/mobile/auth/me')
            .then(r => r.json())
            .then(data => {
                if (!data.error) setProfile(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/mobile/auth/logout', { method: 'POST' });
        router.push('/driver/login');
    };

    if (loading) {
        return (
            <DriverShell>
                <div className="loading-spinner"><div className="spinner" /></div>
            </DriverShell>
        );
    }

    if (!profile) return null;

    return (
        <DriverShell>
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile.firstName?.[0] || '?'}
                    </div>
                    <div className="profile-info">
                        <h2>{profile.fullFio || profile.firstName || 'Без имени'}</h2>
                        <span className="profile-role">{ROLE_LABELS[profile.role] || profile.role}</span>
                    </div>
                </div>

                <div className="profile-fields">
                    <div className="profile-field">
                        <span className="profile-label">📞 Телефон</span>
                        <span className="profile-value">{profile.phone || '—'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="profile-label">🎭 Роль</span>
                        <span className="profile-value">{ROLE_LABELS[profile.role] || profile.role}</span>
                    </div>
                    <div className="profile-field">
                        <span className="profile-label">📋 Статус</span>
                        <span className="profile-value" style={{
                            color: profile.status === 'APPROVED' ? 'var(--gt-success)' : 'var(--gt-warning)'
                        }}>
                            {profile.status === 'APPROVED' ? '✅ Активен' : '⏳ ' + profile.status}
                        </span>
                    </div>
                    {profile.ptsNumber && (
                        <div className="profile-field">
                            <span className="profile-label">📄 ПТС</span>
                            <span className="profile-value">{profile.ptsNumber}</span>
                        </div>
                    )}
                    {profile.carDescription && (
                        <div className="profile-field">
                            <span className="profile-label">🚗 Автомобиль</span>
                            <span className="profile-value">{profile.carDescription}</span>
                        </div>
                    )}
                </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
                🚪 Выйти из аккаунта
            </button>
        </DriverShell>
    );
}
