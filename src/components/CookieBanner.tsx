"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Проверяем согласие только на клиенте
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            zIndex: 9999,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
            flexWrap: 'wrap'
        }}>
            <div style={{ fontSize: '0.9rem', maxWidth: '800px', lineHeight: '1.5', flex: '1 1 300px' }}>
                Мы используем файлы cookie. Продолжая работу с сайтом, вы соглашаетесь с{' '}
                <Link href="/privacy" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    политикой обработки персональных данных
                </Link>.
            </div>
            <button
                onClick={handleAccept}
                style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#000',
                    border: 'none',
                    padding: '10px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    flexShrink: 0
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
                Понятно
            </button>
        </div>
    );
}
