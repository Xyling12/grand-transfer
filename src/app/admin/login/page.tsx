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
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center font-jost p-6 relative overflow-hidden">
            <Head>
                <title>Вход в CRM - GrandTransfer</title>
            </Head>

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                {/* Main glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
                {/* Secondary accent glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] mix-blend-screen pointer-events-none"></div>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md">

                {/* Logo Area */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bodoni text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 drop-shadow-sm font-bold tracking-tight">
                        GrandTransfer
                    </h1>
                    <p className="text-neutral-400 mt-3 text-sm tracking-wide uppercase font-medium">
                        Панель Управления
                    </p>
                </div>

                {/* Login Box */}
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                    {/* Top border highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="text-center space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">Авторизация</h2>
                            <p className="text-sm text-neutral-400 leading-relaxed px-2">
                                Войдите через Telegram для доступа к системе управления заказами.
                            </p>
                        </div>

                        <div className="min-h-[100px] flex flex-col items-center justify-center bg-black/20 rounded-2xl p-6 border border-white/5">
                            {isLoading ? (
                                <div className="animate-pulse flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"></div>
                                    <span className="text-amber-500/80 text-sm font-medium">Проверка доступа...</span>
                                </div>
                            ) : (
                                <div className="w-full flex justify-center">
                                    {/* The div where the Telegram widget sits. 
                                        We scale it up slightly for better touch targets on mobile */}
                                    <div
                                        ref={telegramWrapperRef}
                                        className="flex justify-center h-auto min-h-[40px] transform hover:scale-[1.02] active:scale-95 transition-transform duration-200 origin-center"
                                    ></div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 antialiased shadow-sm">
                                <div className="flex items-start gap-3 text-left">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-8 text-center space-y-6">
                    <p className="text-xs text-neutral-500 px-6 leading-relaxed flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Безопасный вход. Данные защищены по ФЗ-152.
                    </p>

                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Вернуться на сайт
                    </a>
                </div>
            </div>
        </div>
    );
}
