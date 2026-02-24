"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, Car, MapPin, ChevronDown, Menu, X, Search } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon, MaxIcon } from './SocialIcons';
import styles from './Header.module.css';
import { useCity } from '@/context/CityContext';

const NAV_LINKS = [
    { href: '/', label: 'Главная' },
    { href: '/about', label: 'О компании' },
    { href: '/blog', label: 'Блог' },
    { href: '/#tariffs', label: 'Тарифы' },
    { href: '/#reviews', label: 'Отзывы' },
    { href: '/#faq', label: 'FAQ' },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { currentCity, setCity, cityList } = useCity();
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                if (isCityOpen) setIsCityOpen(false);
            }
        };
        // Always listen if either menu is open
        if (isMobileMenuOpen || isCityOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen, isCityOpen]);

    return (
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
            <div className={styles.container} ref={menuRef}>
                <div className={styles.leftGroup}>
                    <Link
                        href="/"
                        className={styles.logo}
                        onClick={(e) => {
                            if (window.location.pathname === '/') {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                    >
                        <div style={{ transform: "scaleX(-1)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "-2px" }}>
                            <Car size={28} strokeWidth={1.5} />
                        </div>
                        <span className={styles.logoText}>GrandTransfer</span>
                    </Link>

                    {/* City Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setIsCityOpen(!isCityOpen);
                                setSearchQuery(''); // Reset search when opening/closing
                            }}
                            className={styles.cityBtn}
                        >
                            <MapPin size={16} />
                            {currentCity.name}
                            <ChevronDown size={14} />
                        </button>

                        {isCityOpen && (
                            <div className={styles.cityDropdown}>
                                <div className={styles.citySearchWrapper}>
                                    <Search size={14} className={styles.citySearchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Поиск города..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles.citySearchInput}
                                        autoFocus
                                    />
                                </div>
                                <div className={styles.cityListScroll}>
                                    {(() => {
                                        const filtered = cityList.filter(city => city.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

                                        if (filtered.length === 0) {
                                            return (
                                                <div className={styles.cityNotFound}>
                                                    <p className={styles.cityNotFoundText}>Нет в списке</p>
                                                    <button
                                                        className={styles.cityNotFoundBtn}
                                                        onClick={() => {
                                                            setIsCityOpen(false);
                                                            setSearchQuery('');
                                                            document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        Свой маршрут
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return filtered.map(city => (
                                            <button
                                                key={city.id}
                                                onClick={() => {
                                                    setCity(city);
                                                    setIsCityOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className={`${styles.cityOption} ${currentCity.id === city.id ? styles.cityOptionActive : ''}`}
                                            >
                                                {city.name}
                                            </button>
                                        ));
                                    })()}
                                </div>
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
                        <a href="https://vk.ru/ru.transfer" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="VK"><VKIcon size={18} /></a>
                        <a href="https://t.me/Rom474" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={18} /></a>
                        <a href="https://wa.me/79501587878" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={18} /></a>
                        <a href="https://max.ru/u/f9LHodD0cOJCpX9My7upgEOBL0dt-DNGWgrFFD4IwEdtYkMWb7DJK1v8yOo" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Max"><MaxIcon size={18} /></a>
                    </div>
                    <a href={`tel:${currentCity.phone.replace(/[^\d+]/g, '')}`} className={styles.callBtn} aria-label="Позвонить">
                        <Phone size={18} />
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
                    <a href="https://vk.ru/ru.transfer" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="VK"><VKIcon size={22} /></a>
                    <a href="https://t.me/Rom474" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Telegram"><TelegramIcon size={22} /></a>
                    <a href="https://wa.me/79501587878" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="WhatsApp"><WhatsAppIcon size={22} /></a>
                    <a href="https://max.ru/u/f9LHodD0cOJCpX9My7upgEOBL0dt-DNGWgrFFD4IwEdtYkMWb7DJK1v8yOo" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Max"><MaxIcon size={22} /></a>
                </div>
            </div>
        </header >
    );
}
