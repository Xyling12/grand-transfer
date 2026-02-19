"use client";

import styles from './PopularRoutes.module.css';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { useCity } from '@/context/CityContext';
import { cities } from '@/data/cities';

const getRouteImage = (routeName: string, index: number) => {
    // 1. Check if destination is a known city with an image
    const destCity = cities.find(c => c.name === routeName);
    if (destCity?.heroImage) {
        return `url(${destCity.heroImage})`;
    }

    // 2. Special cases (like Airport) - placeholders for now
    if (routeName.toLowerCase().includes('аэропорт')) {
        return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
    }

    // 3. Fallback to gradients
    const gradients = [
        'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)', // Indigo-Purple light
        'linear-gradient(135deg, #f9a8d4 0%, #fbcfe8 100%)', // Pink light
        'linear-gradient(135deg, #d8b4fe 0%, #e9d5ff 100%)', // Purple light
        'linear-gradient(135deg, #5eead4 0%, #99f6e4 100%)', // Teal light
        'linear-gradient(135deg, #818cf8 0%, #c7d2fe 100%)', // Indigo light
        'linear-gradient(135deg, #f472b6 0%, #fbcfe8 100%)', // Pink
    ];
    return gradients[index % gradients.length];
};

export default function PopularRoutes() {
    const { currentCity } = useCity();

    return (
        <section className={styles.section}>
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
                            <div
                                className={styles.image}
                                style={{ background: getRouteImage(route.to, i), backgroundSize: 'cover', backgroundPosition: 'center' }}
                            ></div>
                            <div className={styles.content}>
                                <h3 className={styles.route}>
                                    <MapPin size={20} color="var(--color-primary)" />
                                    {route.to}
                                </h3>
                                <div className={styles.details}>
                                    <span>{route.distance} км</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={14} /> {route.duration}
                                    </span>
                                </div>
                                <div className={styles.price}>от {route.price} ₽</div>
                                <button className={styles.button}>
                                    Заказать авто <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
