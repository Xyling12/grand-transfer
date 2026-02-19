"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './Hero.module.css';

import { useCity } from '@/context/CityContext';

import Image from 'next/image';

export default function Hero() {
    const { currentCity } = useCity();

    return (
        <section className={styles.hero}>
            {/* Optimized Background Image */}
            {currentCity.heroImage && (
                <div className={styles.bgImage}>
                    <Image
                        src={currentCity.heroImage}
                        alt={`${currentCity.name} - background`}
                        fill
                        priority
                        className={styles.image}
                        sizes="100vw"
                    />
                    <div className={styles.overlay} />
                </div>
            )}

            <div className={styles.content}>
                <h1 className={styles.title}>
                    Такси из {currentCity.namePrepositional}<br />
                    <span className={styles.highlight}>Ваш личный стандарт путешествий</span>
                </h1>
                <p className={styles.subtitle}>
                    Междугороднее такси, где комфорт и безопасность – не опции, а стандарт.
                    Путешествуйте бизнес-классом по цене обычного такси.
                </p>
                <Link href="#booking-form" className={styles.ctaButton}>
                    Рассчитать стоимость <ArrowRight size={20} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }} />
                </Link>
            </div>
        </section>
    );
}
