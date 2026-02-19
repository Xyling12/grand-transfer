"use client";

import styles from './PopularRoutes.module.css';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { useCity } from '@/context/CityContext';

export default function PopularRoutes() {
    const { currentCity } = useCity();

    return (
        <section className={styles.section} id="routes">
            <div className="container">
                <div className={styles.header}>
                    <h2 className="section-title">
                        Популярные маршруты из <span className={styles.cityName}>{currentCity.namePrepositional}</span>
                    </h2>
                    <p className="section-subtitle">
                        Мы предлагаем фиксированные цены на самые востребованные направления.
                        Стоимость поездки известна заранее и не изменится в пути.
                    </p>
                </div>

                <div className={styles.grid}>
                    {currentCity.popularRoutes.map((route, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                {/* Using a generic gradient pattern instead of static images for now */}
                                <div className={styles.image} style={{
                                    background: `linear-gradient(135deg, ${['#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'][index % 4]} 0%, #FAFAFA 100%)`,
                                    opacity: 0.8
                                }} />
                            </div>
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
