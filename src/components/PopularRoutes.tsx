"use client";

import styles from './PopularRoutes.module.css';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { useCity } from '@/context/CityContext';
import { cities } from '@/data/cities';

// Helper to estimate price per km roughly or use fixed
const getPricePerKm = (price: number, distance: number) => Math.round(price / distance);

export default function PopularRoutes() {
    const { currentCity } = useCity();

    return (
        <section className={`${styles.section} animate-on-scroll`}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Популярные маршруты из <span className={styles.highlight}>{currentCity.namePrepositional}</span>
                    </h2>
                    <p className={styles.subtitle}>
                        Мы предлагаем фиксированные цены на самые востребованные направления.
                        Стоимость поездки известна заранее и не изменится в пути.
                    </p>
                </div>

                <div className={styles.grid}>
                    {currentCity.popularRoutes.map((route, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.routeTitle}>
                                    {currentCity.name} — {route.to}
                                </h3>
                                <p className={styles.routeMeta}>
                                    ~{route.distance} км • {route.duration}
                                </p>
                            </div>

                            <div className={styles.priceBlock}>
                                <div className={styles.price}>от {route.price.toLocaleString('ru-RU')} ₽</div>
                                <div className={styles.priceNote}>Эконом • {getPricePerKm(route.price, route.distance)} ₽/км</div>
                            </div>

                            <button className={styles.button}>
                                Подробнее
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
