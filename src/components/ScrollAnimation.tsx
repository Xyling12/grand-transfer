'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollAnimation() {
    const pathname = usePathname();

    useEffect(() => {
        const observedElements = new WeakSet();

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
            const targets = document.querySelectorAll('.animate-on-scroll');
            targets.forEach(target => {
                if (!observedElements.has(target)) {
                    observer.observe(target);
                    observedElements.add(target);
                }
            });
        };

        // Initial check - wait for hydration
        setTimeout(() => {
            observeNewElements();
        }, 100);

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
