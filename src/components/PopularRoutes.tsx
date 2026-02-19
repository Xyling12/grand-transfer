"use client";

import styles from './PopularRoutes.module.css';
import { MapPin, Clock } from 'lucide-react';
import Image from 'next/image';

// This would eventually come from a CMS or API based on the user's location
const MOCK_CURRENT_CITY = "Казань";

const routes = [
    {
        to: "Москва",
        distance: "820 км",
        time: "10-11 ч",
        price: "от 18 500 ₽",
        image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?q=80&w=600&auto=format&fit=crop"
    },
    {
        to: "Аэропорт (KZN)",
        distance: "25 км",
        time: "30-40 мин",
        price: "от 1 200 ₽",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop"
    },
    {
        to: "Набережные Челны",
        distance: "240 км",
        time: "3-3.5 ч",
        price: "от 5 500 ₽",
        image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=600&auto=format&fit=crop"
    },
    {
        to: "Свияжск",
        distance: "64 км",
        time: "1 ч",
        price: "от 2 500 ₽",
        image: "https://images.unsplash.com/photo-1596716073124-786d1373513e?q=80&w=600&auto=format&fit=crop"
    },
    {
        to: "Самара",
        distance: "360 км",
        time: "5-6 ч",
        price: "от 8 900 ₽",
        image: "https://images.unsplash.com/photo-1569302685657-3720703a152e?q=80&w=600&auto=format&fit=crop"
    },
    {
        to: "Уфа",
        distance: "530 км",
        time: "7-8 ч",
        price: "от 12 500 ₽",
        image: "https://images.unsplash.com/photo-1588667319972-e1d157304192?q=80&w=600&auto=format&fit=crop"
    }
];

export default function PopularRoutes() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className="section-title">
                        Популярные маршруты из <span className={styles.cityName}>{MOCK_CURRENT_CITY}</span>
                    </h2>
                    <p className="section-subtitle">Часто заказываемые направления наших клиентов</p>
                </div>

                <div className={styles.grid}>
                    {routes.map((route, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={route.image}
                                    alt={`Трансфер ${MOCK_CURRENT_CITY} - ${route.to}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className={styles.image}
                                    sizes="(max-width: 768px) 100vw, 300px"
                                />
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.route}>
                                    {route.to}
                                </h3>
                                <div className={styles.details}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={14} color="var(--color-primary)" /> {route.distance}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={14} color="var(--color-primary)" /> {route.time}
                                    </span>
                                </div>
                                <div className={styles.price}>{route.price}</div>
                                <button className={styles.button}>Заказать</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
