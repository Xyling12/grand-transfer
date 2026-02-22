"use client";

import {
    Banknote,
    ShieldCheck,
    Armchair,
    Clock,
    PhoneCall,
    Globe
} from 'lucide-react';
import styles from './WhyChooseUs.module.css';

const features = [
    {
        icon: Banknote,
        title: "Фиксированная цена",
        description: "Стоимость поездки известна заранее и не изменится в пути. Никаких скрытых доплат."
    },
    {
        icon: ShieldCheck,
        title: "Безопасность",
        description: "Только проверенные водители со стажем от 5 лет. Все автомобили регулярно проходят ТО."
    },
    {
        icon: Armchair,
        title: "Комфорт",
        description: "Чистые салоны, климат-контроль, детские кресла и вода для пассажиров."
    },
    {
        icon: Clock,
        title: "Пунктуальность",
        description: "Подача автомобиля точно ко времени. Бесплатное ожидание в аэропорту при задержке рейса."
    },
    {
        icon: PhoneCall,
        title: "24/7 Поддержка",
        description: "Наш диспетчер всегда на связи, чтобы помочь с любым вопросом в любое время суток."
    },
    {
        icon: Globe,
        title: "Любые расстояния",
        description: "Комфортные поездки в другие города, аэропорты и регионы. Мы прокладываем оптимальный маршрут."
    }
];

export default function WhyChooseUs() {
    return (
        <section className={`${styles.section} animate-on-scroll`} id="why-choose-us">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": features.map(f => ({
                            "@type": "Question",
                            "name": `Какие гарантии ${f.title.toLowerCase()} вы предоставляете?`,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": f.description
                            }
                        }))
                    })
                }}
            />
            <div id="about" style={{ position: 'absolute', top: '-100px' }}></div>
            <div className="container">
                <h2 className="section-title">Почему выбирают нас</h2>
                <p className="section-subtitle">
                    Мы не просто перевозим пассажиров, мы создаем условия для комфортного путешествия.
                </p>

                <div className={styles.grid}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className={styles.card}>
                                <div className={styles.iconWrapper}>
                                    <Icon size={32} />
                                </div>
                                <h3 className={styles.cardTitle}>{feature.title}</h3>
                                <p className={styles.cardDescription}>{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
