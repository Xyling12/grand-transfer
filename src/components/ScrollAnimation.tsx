'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollAnimation() {
    const pathname = usePathname();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: stop observing once visible
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Small delay to ensure DOM is ready
        const timeout = setTimeout(() => {
            const targets = document.querySelectorAll('.animate-on-scroll');
            targets.forEach(target => observer.observe(target));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, [pathname]); // Re-run on route change

    return null;
}
