'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function RouteRedirect() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const latFrom = searchParams.get('lat_from');
        const lonFrom = searchParams.get('lon_from');
        const latTo = searchParams.get('lat_to');
        const lonTo = searchParams.get('lon_to');

        if (latTo && lonTo && latFrom && lonFrom) {
            // Android robust intent scheme to bypass WebView blockers
            const naviIntent = `intent://build_route_on_map?lat_from=${latFrom}&lon_from=${lonFrom}&lat_to=${latTo}&lon_to=${lonTo}#Intent;scheme=yandexnavi;package=ru.yandex.yandexnavi;end`;
            const mapsIntent = `intent://maps.yandex.ru/?rtext=${latFrom},${lonFrom}~${latTo},${lonTo}&rtt=auto#Intent;scheme=yandexmaps;package=ru.yandex.yandexmaps;end`;

            // Standard fallback scheme primarily for iOS 
            const iosNavi = `yandexnavi://build_route_on_map?lat_from=${latFrom}&lon_from=${lonFrom}&lat_to=${latTo}&lon_to=${lonTo}`;

            // Check if Android roughly
            const isAndroid = /android/i.test(navigator.userAgent || '');

            if (isAndroid) {
                // Try Navigator intent first, if fails, it won't do anything, but user can click buttons
                window.location.href = naviIntent;
                setTimeout(() => {
                    window.location.href = mapsIntent;
                }, 1000);
            } else {
                window.location.href = iosNavi;
            }
        }
    }, [searchParams]);

    // Variables for buttons
    const latFrom = searchParams.get('lat_from');
    const lonFrom = searchParams.get('lon_from');
    const latTo = searchParams.get('lat_to');
    const lonTo = searchParams.get('lon_to');

    const iosNavi = `yandexnavi://build_route_on_map?lat_from=${latFrom}&lon_from=${lonFrom}&lat_to=${latTo}&lon_to=${lonTo}`;
    const iosMaps = `yandexmaps://maps.yandex.ru/?rtext=${latFrom},${lonFrom}~${latTo},${lonTo}&rtt=auto`;
    const webMaps = `https://yandex.ru/maps/?rtext=${latFrom},${lonFrom}~${latTo},${lonTo}&rtt=auto`;

    return (
        <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2>Запускаем маршрут...</h2>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                Если приложение Яндекса не открылось автоматически (или если у вас iPhone), нажмите нужную кнопку ниже:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <a
                    href={iosNavi}
                    style={{ padding: '16px', background: '#FFCC00', color: '#000', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(255, 204, 0, 0.3)' }}
                >
                    🚗 Открыть в Яндекс.Навигаторе
                </a>
                <a
                    href={iosMaps}
                    style={{ padding: '16px', background: '#FFF1A0', color: '#000', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px' }}
                >
                    🗺️ Открыть в Яндекс.Картах
                </a>
                <a
                    href={webMaps}
                    style={{ padding: '16px', background: '#f5f5f5', color: '#333', textDecoration: 'none', borderRadius: '12px', fontSize: '16px', marginTop: '20px' }}
                >
                    🌐 Открыть в браузере (через сайт Яндекса)
                </a>
            </div>
        </div>
    );
}

export default function RoutePage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Загрузка маршрута...</div>}>
            <RouteRedirect />
        </Suspense>
    );
}
