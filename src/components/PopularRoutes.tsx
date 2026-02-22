"use client";
"use client";

import styles from './PopularRoutes.module.css';
import { useCity } from '@/context/CityContext';
import { useRouter } from 'next/navigation';

export default function PopularRoutes() {
    const { currentCity } = useCity();
    const router = useRouter();

    const handleRouteClick = (toCity: string) => {
        router.push(`/?from=${encodeURIComponent(currentCity.name)}&to=${encodeURIComponent(toCity)}&tariff=standart#booking-form`, { scroll: false });
        setTimeout(() => {
            document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <section className={`${styles.section} animate - on - scroll`} id="popular-routes">
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
                            </div>

                            <button className={styles.button} onClick={() => handleRouteClick(route.to)}>
                                Подробнее
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
