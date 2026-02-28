'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DriverRegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        fullFio: '',
        phone: '',
        password: '',
        passwordConfirm: '',
        ptsNumber: '',
        stsNumber: '',
        carDescription: '',
        role: 'DRIVER',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.password !== form.passwordConfirm) {
            setError('Пароли не совпадают');
            return;
        }

        if (form.password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/mobile/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullFio: form.fullFio,
                    phone: form.phone,
                    password: form.password,
                    ptsNumber: form.ptsNumber,
                    stsNumber: form.stsNumber,
                    carDescription: form.carDescription,
                    role: form.role,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Ошибка регистрации');
                return;
            }

            setSuccess(data.message);
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
                    <div className="auth-logo-icon">📝</div>
                    <h1>Регистрация</h1>
                    <p>Заполните данные для работы</p>
                </div>

                {success ? (
                    <div className="auth-success">
                        <div className="success-icon">✅</div>
                        <p>{success}</p>
                        <Link href="/driver/login" className="auth-btn">
                            Перейти к входу
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        {/* Role selection */}
                        <div className="form-group">
                            <label>Роль</label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-btn ${form.role === 'DRIVER' ? 'active' : ''}`}
                                    onClick={() => updateField('role', 'DRIVER')}
                                >
                                    🚕 Водитель
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${form.role === 'DISPATCHER' ? 'active' : ''}`}
                                    onClick={() => updateField('role', 'DISPATCHER')}
                                >
                                    🎧 Диспетчер
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="fullFio">ФИО *</label>
                            <input
                                id="fullFio"
                                type="text"
                                placeholder="Иванов Иван Иванович"
                                value={form.fullFio}
                                onChange={e => updateField('fullFio', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-phone">Телефон *</label>
                            <input
                                id="reg-phone"
                                type="tel"
                                placeholder="+7 (999) 123-45-67"
                                value={form.phone}
                                onChange={e => updateField('phone', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password">Пароль *</label>
                            <input
                                id="reg-password"
                                type="password"
                                placeholder="Минимум 6 символов"
                                value={form.password}
                                onChange={e => updateField('password', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password-confirm">Подтверждение пароля *</label>
                            <input
                                id="reg-password-confirm"
                                type="password"
                                placeholder="Повторите пароль"
                                value={form.passwordConfirm}
                                onChange={e => updateField('passwordConfirm', e.target.value)}
                                required
                            />
                        </div>

                        {form.role === 'DRIVER' && (
                            <>
                                <div className="form-divider">
                                    <span>Данные автомобиля</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="ptsNumber">Номер ПТС</label>
                                    <input
                                        id="ptsNumber"
                                        type="text"
                                        placeholder="77 АА 123456"
                                        value={form.ptsNumber}
                                        onChange={e => updateField('ptsNumber', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="stsNumber">Номер СТС</label>
                                    <input
                                        id="stsNumber"
                                        type="text"
                                        placeholder="77 77 123456"
                                        value={form.stsNumber}
                                        onChange={e => updateField('stsNumber', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="carDescription">Автомобиль</label>
                                    <input
                                        id="carDescription"
                                        type="text"
                                        placeholder="Toyota Camry, белый, А777АА77"
                                        value={form.carDescription}
                                        onChange={e => updateField('carDescription', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Отправка...' : 'Зарегистрироваться'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>Уже есть аккаунт? <Link href="/driver/login">Войти</Link></p>
                </div>
            </div>
        </div>
    );
}
