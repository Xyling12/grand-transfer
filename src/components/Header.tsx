"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, Car, MapPin, ChevronDown, Menu, X } from "lucide-react";
import { VKIcon, TelegramIcon, WhatsAppIcon, MaxIcon } from "./SocialIcons";
import styles from "./Header.module.css";
import { useCity } from "@/context/CityContext";

const NAV_LINKS = [
  { href: "#top", label: "Главная" },
  { href: "#booking-form", label: "Калькулятор" },
  { href: "#why-choose-us", label: "О нас" },
  { href: "#tariffs", label: "Тарифы" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  const { currentCity, setCity, cityList } = useCity();

  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeHash, setActiveHash] = useState("#top");

  const menuRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setIsCityOpen(false);
      }
    };
    if (isCityOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCityOpen]);

  // ScrollSpy: highlight active section
  useEffect(() => {
    const sectionIds = NAV_LINKS
      .map((l) => l.href)
      .filter((h) => h.startsWith("#"))
      .map((h) => h.slice(1));

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) {
          setActiveHash(`#${visible.target.id}`);
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.08, 0.12, 0.2, 0.35],
      }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const phoneHref = `tel:${currentCity.phone.replace(/[^\d+]/g, "")}`;

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.leftGroup}>
          <Link href="#top" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
            <Car size={28} />
            <span className={styles.logoText}>GrandTransfer</span>
          </Link>

          {/* City Selector */}
          <div ref={cityRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsCityOpen((v) => !v)}
              className={styles.cityBtn}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isCityOpen}
            >
              <MapPin size={16} />
              {currentCity.name}
              <ChevronDown size={14} />
            </button>

            {isCityOpen && (
              <div className={styles.cityDropdown} role="listbox">
                {cityList.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      setCity(city);
                      setIsCityOpen(false);
                    }}
                    className={`${styles.cityOption} ${
                      currentCity.id === city.id ? styles.cityOptionActive : ""
                    }`}
                    type="button"
                    role="option"
                    aria-selected={currentCity.id === city.id}
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${activeHash === link.href ? styles.linkActive : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className={styles.actions}>
          <div className={styles.socials}>
            <a
              href="https://vk.ru/ru.transfer"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="VK"
            >
              <VKIcon size={18} />
            </a>
            <a
              href="https://t.me/Rom474"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Telegram"
            >
              <TelegramIcon size={18} />
            </a>
            <a
              href="https://wa.me/79501587878"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="WhatsApp"
            >
              <WhatsAppIcon size={18} />
            </a>
            <a
              href="https://max.ru/u/f9LHodD0cOJCpX9My7upgEOBL0dt-DNGWgrFFD4IwEdtYkMWb7DJK1v8yOo"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Max"
            >
              <MaxIcon size={18} />
            </a>
          </div>

          <a href={phoneHref} className={styles.callBtn}>
            <Phone size={18} className={styles.phoneIcon} />
            <span className={styles.phoneText}>{currentCity.phone}</span>
          </a>

          {/* Hamburger — shows ≤1150px */}
          <button
            className={styles.hamburger}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Меню"
            type="button"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — always rendered, toggled via CSS */}
      <div
        ref={menuRef}
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.mobileLink} ${
              activeHash === link.href ? styles.mobileLinkActive : ""
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ transitionDelay: isMobileMenuOpen ? `${i * 40}ms` : "0ms" }}
          >
            {link.label}
          </Link>
        ))}

        <div
          className={styles.mobileSocials}
          style={{ transitionDelay: isMobileMenuOpen ? "200ms" : "0ms" }}
        >
          <a
            href="https://vk.ru/ru.transfer"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="VK"
          >
            <VKIcon size={22} />
          </a>
          <a
            href="https://t.me/Rom474"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="Telegram"
          >
            <TelegramIcon size={22} />
          </a>
          <a
            href="https://wa.me/79501587878"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={22} />
          </a>
          <a
            href="https://max.ru/u/f9LHodD0cOJCpX9My7upgEOBL0dt-DNGWgrFFD4IwEdtYkMWb7DJK1v8yOo"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="Max"
          >
            <MaxIcon size={22} />
          </a>
        </div>
      </div>
    </header>
  );
}