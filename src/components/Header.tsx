"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, Car, MapPin, ChevronDown, Menu, X } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon, MaxIcon } from './SocialIcons';
import styles from './Header.module.css';
import { useCity } from '@/context/CityContext';

const NAV_LINKS = [
    { href: '/', label: 'Главная' },
    { href: '#why-choose-us', label: 'О нас' },
    { href: '#tariffs', label: 'Тарифы' },
    { href: '#reviews', label: 'Отзывы' },
    { href: '#contacts', label: 'Контакты' },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { currentCity, setCity, cityList } = useCity();
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        if (isMobileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    return (
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.leftGroup}>
                    <Link href="/" className={styles.logo}>
                        <Car size={28} />
                        <span className={styles.logoText}>GrandTransfer</span>
                    </Link>

                    {/* City Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsCityOpen(!isCityOpen)}
                            className={styles.cityBtn}
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
                                background: 'var(--color-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                boxShadow: 'var(--shadow-card)',
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
                                            background: currentCity.id === city.id ? 'rgba(202, 138, 4, 0.15)' : 'transparent',
                                            color: currentCity.id === city.id ? 'var(--color-primary)' : 'var(--color-foreground)',
                                            border: 'none',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: currentCity.id === city.id ? 600 : 400,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {city.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className={styles.nav}>
                    <div className={styles.navLinks}>
                        {NAV_LINKS.map(link => (
                            <Link key={link.href} href={link.href} className={styles.link}>{link.label}</Link>
                        ))}
                    </div>
                </nav>

                <div className={styles.actions}>
                    <div className={styles.socials}>
                        <a href="#" className={styles.socialIcon} aria-label="VK"><VKIcon size={20} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={20} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={20} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="Max"><MaxIcon size={20} /></a>
                    </div>
                    <a href={`tel:${currentCity.phone.replace(/[^\d+]/g, '')}`} className={styles.callBtn}>
                        <Phone size={18} className={styles.phoneIcon} />
                        <span className={styles.phoneText}>{currentCity.phone}</span>
                    </a>

                    {/* Hamburger — shows ≤1150px */}
                    <button
                        className={styles.hamburger}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Меню"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu — always rendered, toggled via CSS */}
            <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                {NAV_LINKS.map((link, i) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={styles.mobileLink}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ transitionDelay: isMobileMenuOpen ? `${i * 40}ms` : '0ms' }}
                    >
                        {link.label}
                    </Link>
                ))}
                <div className={styles.mobileSocials} style={{ transitionDelay: isMobileMenuOpen ? '200ms' : '0ms' }}>
                    <a href="#" className={styles.socialIcon} aria-label="VK"><VKIcon size={22} /></a>
                    <a href="#" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={22} /></a>
                    <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={22} /></a>
                    <a href="#" className={styles.socialIcon} aria-label="Max"><MaxIcon size={22} /></a>
                </div>
            </div>
        </header>
    );
}
