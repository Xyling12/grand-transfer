"use client";

import styles from './Footer.module.css';
import Link from 'next/link';
import { Phone, Mail, MapPin, Car } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon } from './SocialIcons';
import { useCity } from '@/context/CityContext';

export default function Footer() {
    const { currentCity } = useCity();

    return (
        <footer className={styles.footer} id="contacts">
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <Link href="/" className={styles.logo}>
                            <Car size={24} />
                            GrandTransfer
                        </Link>
                        <p className={styles.description}>
                            Ваш надежный партнер в междугородних поездках. Комфорт бизнес-класса по доступным ценам.
                            Работаем в {currentCity.namePrepositional} и по всей России.
                        </p>
                        <div className={styles.socials}>
                            <a href="#" className={styles.socialLink} aria-label="VK"><VKIcon size={20} /></a>
                            <a href="#" className={styles.socialLink} aria-label="Telegram"><TelegramIcon size={20} /></a>
                            <a href="#" className={styles.socialLink} aria-label="WhatsApp"><WhatsAppIcon size={20} /></a>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3 className={styles.heading}>Компания</h3>
                        <div className={styles.links}>
                            <Link href="#about" className={styles.link}>О нас</Link>
                            <Link href="#tariffs" className={styles.link}>Тарифы</Link>
                            <Link href="#reviews" className={styles.link}>Отзывы</Link>
                            <Link href="#faq" className={styles.link}>Частые вопросы</Link>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3 className={styles.heading}>Направления</h3>
                        <div className={styles.links}>
                            {currentCity.popularRoutes.slice(0, 5).map((route, i) => (
                                <Link key={i} href="#routes" className={styles.link}>
                                    {currentCity.name} - {route.to}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3 className={styles.heading}>Контакты</h3>
                        <div className={styles.links}>
                            <div className={styles.contactItem}>
                                <Phone size={18} className={styles.contactIcon} />
                                <span>+7 (999) 000-00-00</span>
                            </div>
                            <div className={styles.contactItem}>
                                <Mail size={18} className={styles.contactIcon} />
                                <span>booking@grand-transfer.ru</span>
                            </div>
                            <div className={styles.contactItem}>
                                <MapPin size={18} className={styles.contactIcon} />
                                <span>г. Казань, ул. Баумана, 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© {new Date().getFullYear()} GrandTransfer. Все права защищены.</p>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <Link href="#" className={styles.link}>Политика конфиденциальности</Link>
                        <Link href="#" className={styles.link}>Публичная оферта</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
