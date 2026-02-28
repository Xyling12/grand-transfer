'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DriverData {
    id: string;
    fullFio: string | null;
    firstName: string | null;
    phone: string | null;
    role: string;
    status: string;
}

export default function DriverShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [driver, setDriver] = useState<DriverData | null>(null);

    useEffect(() => {
        fetch('/api/mobile/auth/me')
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    router.push('/driver/login');
                } else {
                    setDriver(data);
                }
            })
            .catch(() => router.push('/driver/login'));
    }, [router]);

    const isAdmin = driver?.role === 'ADMIN';
    const isDispatcher = driver?.role === 'DISPATCHER' || isAdmin;

    const navItems = [
        { href: '/driver/orders', icon: '📋', label: 'Заказы' },
        { href: '/driver/my-orders', icon: '🚗', label: 'Мои' },
        ...(isDispatcher ? [{ href: '/driver/active', icon: '👀', label: 'Активные' }] : []),
        ...(isAdmin ? [{ href: '/driver/admin', icon: '⚙️', label: 'Админ' }] : []),
        { href: '/driver/profile', icon: '👤', label: 'Профиль' },
    ];

    if (!driver) {
        return (
            <div className="driver-shell">
                <div className="loading-spinner">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="driver-shell">
            <header className="driver-header">
                <h1>GrandTransfer</h1>
                <div className="header-user">
                    <span style={{ fontSize: 12, color: 'var(--gt-text-muted)' }}>
                        {driver.role === 'ADMIN' ? '👑' : driver.role === 'DISPATCHER' ? '🎧' : '🚕'}
                    </span>
                    <div className="header-avatar">
                        {driver.firstName?.[0] || '?'}
                    </div>
                </div>
            </header>

            <main className="driver-content">
                {children}
            </main>

            <nav className="driver-nav">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
