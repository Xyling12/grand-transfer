"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, Car, MapPin, ChevronDown, Menu, X } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon, MaxIcon } from './SocialIcons';
import styles from './Header.module.css';
import { useCity } from '@/context/CityContext';

const NAV_LINKS = [
    { href: '/', label: 'Главная' },
    { href: '#tariffs', label: 'Тарифы' },
    { href: '#why-choose-us', label: 'О нас' },
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

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenu} ref={menuRef}>
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.mobileLink}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className={styles.mobileSocials}>
                        <a href="#" className={styles.socialIcon} aria-label="VK"><VKIcon size={22} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={22} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={22} /></a>
                        <a href="#" className={styles.socialIcon} aria-label="Max"><MaxIcon size={22} /></a>
                    </div>
                </div>
            )}
        </header>
    );
}
