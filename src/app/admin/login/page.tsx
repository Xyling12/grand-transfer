'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

export default function AdminLogin() {
    const router = useRouter();
    const telegramWrapperRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // This callback is called when Telegram widget successfully finishes auth
    useEffect(() => {
        (window as any).onTelegramAuth = async (user: any) => {
            setIsLoading(true);
            setError('');
            try {
                const res = await fetch('/api/auth/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                const data = await res.json();

                if (res.ok) {
                    router.push('/admin/drivers'); // Redirect safely on success
                } else {
                    setError(data.error || 'Ошибка авторизации. Убедитесь, что у вас есть права Администратора.');
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Auth error", err);
                setError('Произошла сетевая ошибка при авторизации.');
                setIsLoading(false);
            }
        };

        // Dynamically inject the Telegram Script
        // Doing this in useEffect ensures it's client-side and we can attach it precisely
        if (telegramWrapperRef.current && !telegramWrapperRef.current.hasChildNodes()) {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            // IMPORTANT: Bot username must be exact!
            script.setAttribute('data-telegram-login', 'grandtransferIZH_bot');
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-radius', '10');
            script.setAttribute('data-request-access', 'write');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.async = true;
            telegramWrapperRef.current.appendChild(script);
        }

        return () => {
            // Cleanup if needed
            if (telegramWrapperRef.current) {
                telegramWrapperRef.current.innerHTML = '';
            }
        };
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--color-background)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'var(--font-body)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Head>
                <title>Вход в CRM - GrandTransfer</title>
            </Head>

            {/* Background Effects */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {/* Main glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px', height: '600px',
                    background: 'var(--color-primary-glow)',
                    borderRadius: '50%',
                    filter: 'blur(100px)',
                    mixBlendMode: 'screen',
                    pointerEvents: 'none'
                }}></div>
            </div>

            {/* Main Card */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>

                {/* Logo Area */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="gold-text" style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '3rem',
                        fontWeight: '700',
                        lineHeight: 1.1,
                        margin: 0
                    }}>
                        GrandTransfer
                    </h1>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        marginTop: '12px',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '500'
                    }}>
                        Панель Управления
                    </p>
                </div>

                {/* Login Box */}
                <div style={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '2.5rem 2rem',
                    boxShadow: 'var(--shadow-card)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-foreground)', marginBottom: '8px' }}>
                                Авторизация
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                Войдите через Telegram для доступа к системе управления заказами.
                            </p>
                        </div>

                        <div style={{
                            minHeight: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '2.5rem', height: '2.5rem',
                                        borderRadius: '50%',
                                        border: '3px solid rgba(202, 138, 4, 0.2)',
                                        borderTopColor: 'var(--color-primary)',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        Проверка доступа...
                                    </span>
                                </div>
                            ) : (
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <div ref={telegramWrapperRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }}></div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Notes */}
                <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        lineHeight: '1.6',
                        padding: '0 1rem'
                    }}>
                        Безопасный вход. Данные защищены в соответствии с общими положениями ФЗ-152.
                    </p>

                    <a href="/" style={{
                        display: 'inline-block',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)',
                        textDecoration: 'none'
                    }}>
                        &larr; Вернуться на сайт
                    </a>
                </div>
            </div>
        </div>
    );
}
