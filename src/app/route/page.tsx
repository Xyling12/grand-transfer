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
            // 2GIS format uses LONGITUDE first, then LATITUDE.
            const dgisIntent = `intent://2gis.ru/routeSearch/rsType/car/from/${lonFrom},${latFrom}/to/${lonTo},${latTo}#Intent;scheme=dgis;package=ru.dublgis.dgismobile;end`;

            // Standard fallback scheme primarily for iOS 
            const iosDgis = `dgis://2gis.ru/routeSearch/rsType/car/from/${lonFrom},${latFrom}/to/${lonTo},${latTo}`;
            const webDgis = `https://2gis.ru/routing?waypoint1=${lonFrom}%2C${latFrom}&waypoint2=${lonTo}%2C${latTo}&type=car`;

            // Check if Android roughly
            const isAndroid = /android/i.test(navigator.userAgent || '');

            if (isAndroid) {
                // Try 2GIS intent exclusively. Will prompt to install from Play Market if not present.
                window.location.href = dgisIntent;
            } else {
                window.location.href = iosDgis;
                // Add minor timeout to fallback to web if 2GIS iOS app is missing
                setTimeout(() => {
                    window.location.href = webDgis;
                }, 2500);
            }
        }
    }, [searchParams]);

    // Variables for buttons
    const latFrom = searchParams.get('lat_from');
    const lonFrom = searchParams.get('lon_from');
    const latTo = searchParams.get('lat_to');
    const lonTo = searchParams.get('lon_to');

    // 2GIS app format: lon,lat
    const iosDgis = `dgis://2gis.ru/routeSearch/rsType/car/from/${lonFrom},${latFrom}/to/${lonTo},${latTo}`;
    // 2GIS Web Format (works universally on Desktop, iOS, Android):
    const webDgis = `https://2gis.ru/directions/points/${lonFrom}%2C${latFrom}%3B${lonTo}%2C${latTo}`;

    return (
        <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2>Запускаем маршрут...</h2>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                Если приложение не открылось автоматически, нажмите нужную кнопку:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <a
                    href={iosDgis}
                    style={{ padding: '16px', background: '#97CC04', color: '#fff', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(151, 204, 4, 0.4)' }}
                >
                    🟢 Открыть в 2GIS
                </a>
                <a
                    href={webDgis}
                    style={{ padding: '16px', background: '#f5f5f5', color: '#333', textDecoration: 'none', borderRadius: '12px', fontSize: '16px', marginTop: '20px' }}
                >
                    🌐 Открыть онлайн (в браузере)
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
