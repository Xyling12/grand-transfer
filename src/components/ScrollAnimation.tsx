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
                    // Stop observing once visible to prevent re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Function to find and observe new elements
        const observeNewElements = () => {
            const targets = document.querySelectorAll('.animate-on-scroll:not([data-observed="true"])');
            targets.forEach(target => {
                observer.observe(target);
                target.setAttribute('data-observed', 'true');
            });
        };

        // Initial check
        observeNewElements();

        // Watch for DOM changes (React updates)
        const mutationObserver = new MutationObserver((mutations) => {
            let shouldCheck = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    shouldCheck = true;
                    break;
                }
            }
            if (shouldCheck) observeNewElements();
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [pathname]);

    return null;
}
