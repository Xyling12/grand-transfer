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
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center font-jost p-4">
            <Head>
                <title>Вход в панель управления - GrandTransfer</title>
            </Head>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-200"></div>
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

                <div>
                    <h1 className="text-3xl font-bodoni text-amber-500">GrandTransfer</h1>
                    <p className="text-gray-400 mt-2 text-sm">Вход в панель управления</p>
                </div>

                <div className="min-h-[100px] flex flex-col items-center justify-center">
                    {isLoading ? (
                        <div className="animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                            <span className="text-gray-300 text-sm">Проверка прав доступа...</span>
                        </div>
                    ) : (
                        <div ref={telegramWrapperRef} className="flex justify-center h-auto min-h-[40px]">
                            {/* Telegram script mounts here */}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm antialiased">
                        {error}
                    </div>
                )}

                <p className="text-xs text-neutral-500 leading-relaxed font-light mt-4">
                    Доступ разрешен только администраторам с подтвержденной ролью в базе данных сервиса в соответствии с ФЗ-152.
                </p>
            </div>

            <a href="/" className="mt-8 text-sm text-gray-500 hover:text-white transition-colors">
                &larr; Вернуться на главный сайт
            </a>
        </div>
    );
}
