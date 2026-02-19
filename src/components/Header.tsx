"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Car, MessageCircle } from 'lucide-react'; // Assuming lucide-react is installed
import styles from './Header.module.css';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <Car size={28} />
                    GrandTransfer
                </Link>

                <nav className={styles.nav}>
                    <div className={styles.navLinks}>
                        <Link href="#tariffs" className={styles.link}>Тарифы</Link>
                        <Link href="#about" className={styles.link}>О нас</Link>
                        <Link href="#reviews" className={styles.link}>Отзывы</Link>
                        <Link href="#contacts" className={styles.link}>Контакты</Link>
                    </div>

                    <div className={styles.actions}>
                        <div className={styles.socials}>
                            {/* VK icon placeholder (using generic if Lucide doesn't have it, or custom SVG later) */}
                            <a href="#" className={styles.socialIcon} aria-label="VK"><MessageCircle size={20} /></a>
                            <a href="#" className={styles.socialIcon} aria-label="Telegram"><div style={{ fontSize: 14, fontWeight: 'bold' }}>TG</div></a>
                            <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><div style={{ fontSize: 14, fontWeight: 'bold' }}>WA</div></a>
                        </div>
                        <button className={styles.callBtn}>
                            <Phone size={16} style={{ display: 'inline', marginRight: 8 }} />
                            Позвонить
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
