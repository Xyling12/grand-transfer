'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DriverLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/mobile/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Ошибка входа');
                return;
            }

            router.push('/driver/orders');
        } catch {
            setError('Ошибка соединения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="driver-auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🚗</div>
                    <h1>GrandTransfer</h1>
                    <p>Вход для водителей</p>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="phone">Телефон</label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="+7 (999) 123-45-67"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Нет аккаунта? <Link href="/driver/register">Зарегистрироваться</Link></p>
                </div>
            </div>
        </div>
    );
}
