"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Car, MapPin, ChevronDown } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon } from './SocialIcons';
import styles from './Header.module.css';
import { useCity } from '@/context/CityContext';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { currentCity, setCity, cityList } = useCity();
    const [isCityOpen, setIsCityOpen] = useState(false);


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
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link href="/" className={styles.logo}>
                        <Car size={28} />
                        GrandTransfer
                    </Link>

                    {/* City Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsCityOpen(!isCityOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <MapPin size={16} />
                            {currentCity.name}
                            <ChevronDown size={14} />
                        </button>

                        {isCityOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '10px',
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                padding: '10px',
                                minWidth: '200px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                {cityList.map(city => (
                                    <button
                                        key={city.id}
                                        onClick={() => {
                                            setCity(city);
                                            setIsCityOpen(false);
                                        }}
                                        style={{
                                            textAlign: 'left',
                                            background: currentCity.id === city.id ? 'var(--color-primary-light)' : 'transparent',
                                            color: currentCity.id === city.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: currentCity.id === city.id ? 600 : 400
                                        }}
                                    >
                                        {city.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div className={styles.navLinks}>
                        <Link href="#tariffs" className={styles.link}>Тарифы</Link>
                        <Link href="#about" className={styles.link}>О нас</Link>
                        <Link href="#reviews" className={styles.link}>Отзывы</Link>
                        <Link href="#contacts" className={styles.link}>Контакты</Link>
                    </div>
                </nav>

                <div className={styles.actions}>
                    <div className={styles.socials}>
                        <a href="#" className={styles.socialIcon} aria-label="VK"><VKIcon size={20} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={20} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={20} /></a>
                    </div>
                    <a href={`tel:${currentCity.phone.replace(/[^\d+]/g, '')}`} className={styles.callBtn}>
                        <Phone size={18} className={styles.phoneIcon} />
                        <span className={styles.phoneText}>{currentCity.phone}</span>
                    </a>
                </div>
            </div>
        </header>
    );
}
