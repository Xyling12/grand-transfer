'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function MetrikaTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Only run on the client
        if (typeof window === 'undefined') return;

        // Yandex Metrika Initialization Code
        (function (m: any, e: any, t: any, r: any, i: any, k: any, a: any) {
            m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
            m[i].l = 1 * (new Date() as any);
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym", undefined, undefined);

        // REPLACE WITH USER'S ID: 106952983
        const metrikaId = 106952983;

        // Prevent multiple initializations in React 18 strict mode
        if (!(window as any)[`yandex_metrika_initialized_${metrikaId}`]) {
            (window as any).ym(metrikaId, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true
            });
            (window as any)[`yandex_metrika_initialized_${metrikaId}`] = true;
        }

    }, []);

    // Track page views on route change
    useEffect(() => {
        const url = pathname + searchParams.toString();
        const metrikaId = 106952983;

        if (typeof window !== 'undefined' && (window as any).ym) {
            (window as any).ym(metrikaId, 'hit', url);
        }
    }, [pathname, searchParams]);

    return null;
}

export default function YandexMetrika() {
    return (
        <Suspense fallback={null}>
            <MetrikaTracker />
            <noscript>
                <div>
                    <img src="https://mc.yandex.ru/watch/106952983" style={{ position: 'absolute', left: '-9999px' }} alt="" />
                </div>
            </noscript>
        </Suspense>
    );
}
