'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

function MetrikaPageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = pathname + searchParams.toString();
        const metrikaId = 106952983;

        // If ym is ready, send a hit on route change
        if (typeof window !== 'undefined' && (window as any).ym) {
            (window as any).ym(metrikaId, 'hit', url);
        }
    }, [pathname, searchParams]);

    return null;
}

export default function YandexMetrika() {
    return (
        <Suspense fallback={null}>
            <MetrikaPageViewTracker />
            <Script id="yandex-metrika" strategy="afterInteractive">
                {`
                   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                   m[i].l=1*new Date();
                   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                   ym(106952983, "init", {
                        clickmap:true,
                        trackLinks:true,
                        accurateTrackBounce:true,
                        webvisor:true
                   });
                `}
            </Script>
            <noscript>
                <div>
                    <img src="https://mc.yandex.ru/watch/106952983" style={{ position: 'absolute', left: '-9999px' }} alt="" />
                </div>
            </noscript>
        </Suspense>
    );
}
