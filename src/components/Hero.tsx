"use client";


import { ArrowRight, Phone } from 'lucide-react';
import styles from './Hero.module.css';
// Image removed
import { useCity } from '@/context/CityContext';

export default function Hero() {
    const { currentCity } = useCity();

    const scrollToBooking = () => {
        const element = document.getElementById('booking-form');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className={styles.heroSection}>
            {/* Gradient Background (No Image) */}
            <div className={styles.bgImage}>
                {/* CSS gradient is applied via .bgImage/overlay or .heroSection background */}
                <div className={styles.overlay}></div>
            </div>

            <div className="container">
                <div className={styles.content}>
                    <h1 className={`${styles.title} animate-on-scroll`}>
                        <span className={styles.titleTop}>ПРЕМИУМ ТРАНСФЕР</span>
                        <span className={styles.titleMiddle}>Такси Межгород</span>
                        <span className={styles.titleBottom}>из г. {currentCity.name}</span>
                    </h1>

                    <p className={`${styles.subtitle} animate-on-scroll delay-100`}>
                        Комфортные поездки в любой город. Фиксированная цена.<br />
                        Безопасно, надежно, вовремя.
                    </p>

                    <div className={`${styles.actions} animate-on-scroll delay-200`}>
                        <button onClick={scrollToBooking} className={styles.primaryBtn}>
                            Рассчитать стоимость <ArrowRight size={20} />
                        </button>
                        <a href={`tel:${currentCity.phone.replace(/[^\d+]/g, '')}`} className={styles.secondaryBtn}>
                            <Phone size={20} /> Позвонить диспетчеру
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
