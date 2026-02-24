"use client";

import styles from './Footer.module.css';
import Link from 'next/link';
import { Phone, Mail, Car } from 'lucide-react';
import { VKIcon, TelegramIcon, WhatsAppIcon, MaxIcon } from './SocialIcons';
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
                            <a href="https://vk.ru/ru.transfer" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="VK"><VKIcon size={20} /></a>
                            <a href="https://t.me/Rom474" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Telegram"><TelegramIcon size={20} /></a>
                            <a href="https://wa.me/79501587878" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="WhatsApp"><WhatsAppIcon size={20} /></a>
                            <a href="https://max.ru/u/f9LHodD0cOJCpX9My7upgEOBL0dt-DNGWgrFFD4IwEdtYkMWb7DJK1v8yOo" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Max"><MaxIcon size={20} /></a>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3 className={styles.heading}>Компания</h3>
                        <ul className={styles.links}>
                            <li><Link href="/" className={styles.link}>Главная</Link></li>
                            <li><Link href="/about" className={styles.link}>О компании</Link></li>
                            <li><Link href="/blog" className={styles.link}>Блог / Статьи</Link></li>
                            <li><Link href="/#tariffs" className={styles.link}>Тарифы</Link></li>
                            <li><Link href="/#reviews" className={styles.link}>Отзывы</Link></li>
                            <li><Link href="/#popular-routes" className={styles.link}>Популярные маршруты</Link></li>
                        </ul>
                    </div>

                    <div className={styles.column}>
                        <h3 className={styles.heading}>Направления</h3>
                        <div className={styles.links}>
                            {currentCity.popularRoutes.slice(0, 5).map((route, i) => (
                                <Link key={i} href="/#popular-routes" className={styles.link}>
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
                                <span>+7 950 158 7878</span>
                            </div>
                            <div className={styles.contactItem}>
                                <Mail size={18} className={styles.contactIcon} />
                                <span>romanbatkovic1@yandex.ru</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© {new Date().getFullYear()} GrandTransfer. Все права защищены.</p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link href="/privacy" className={styles.link}>Политика конфиденциальности</Link>
                        <Link href="/terms" className={styles.link}>Пользовательское соглашение</Link>
                        <span style={{ color: 'var(--color-text-muted)' }}>Разработка: <a href="https://t.me/mxivsh" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Ившин М.С</a></span>
                    </div>
                </div>
                <div className={styles.disclaimer}>
                    Информация на сайте носит исключительно информационный характер и не является публичной офертой в соответствии со ст. 437 ГК РФ. Окончательная стоимость поездки согласовывается при оформлении заказа.
                </div>
            </div>
        </footer>
    );
}
