"use client";


import { useSearchParams } from 'next/navigation';
import { ArrowRight, Phone } from 'lucide-react';
import styles from './Hero.module.css';
// Image removed
import { useCity } from '@/context/CityContext';
import { Suspense } from 'react';

function HeroContent({ defaultToCity }: { defaultToCity?: string }) {
    const { currentCity } = useCity();
    const searchParams = useSearchParams();
    const utmCampaign = searchParams.get('utm_campaign');

    const scrollToBooking = () => {
        const element = document.getElementById('booking-form');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    let mainTitle = 'Междугороднее такси';
    let middleTitle = <>Такси<br />Межгород</>;
    let subTitle = `из г. ${currentCity.name}`;
    let descriptionText = <>Комфортные поездки в любой город. Фиксированная цена.<br />Безопасно, надежно, вовремя.</>;

    if (defaultToCity) {
        mainTitle = `Такси ${currentCity.name} — ${defaultToCity}`;
        middleTitle = <></>;
        subTitle = '';
        descriptionText = <>Прямой рейс без пересадок. Фиксированная цена.<br />Выгодный трансфер от двери до двери.</>;
    } else if (utmCampaign === 'search_border') {
        mainTitle = 'Трансфер до границы';
        middleTitle = <>Такси<br />до КПП</>;
        descriptionText = <>Поездки до границы и контрольно-пропускных пунктов.<br />Помощь с багажом. Точный расчет.</>;
    } else if (utmCampaign === 'search_general') {
        mainTitle = 'Премиальный трансфер';
        descriptionText = <>Чистые авто (Комфорт, Бизнес, Минивэн). Подача вовремя.<br />Точный расчет на сайте.</>;
    }

    return (
        <section className={styles.heroSection}>
            <div className={styles.bgImage}>
                <div className={styles.overlay}></div>
            </div>

            <div className="container">
                <div className={styles.content}>
                    <h1 className={`${styles.title} animate-on-scroll`}>
                        <span className={styles.titleTop}>{mainTitle}</span>
                        {middleTitle && <span className={styles.titleMiddle}>{middleTitle}</span>}
                        {subTitle && <span className={styles.titleBottom}>{subTitle}</span>}
                    </h1>

                    <p className={`${styles.subtitle} animate-on-scroll delay-100`}>
                        {descriptionText}
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

export default function Hero({ defaultToCity }: { defaultToCity?: string }) {
    return (
        <Suspense fallback={<div className={styles.heroSection}></div>}>
            <HeroContent defaultToCity={defaultToCity} />
        </Suspense>
    );
}
