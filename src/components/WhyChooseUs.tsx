"use client";

import {
    Banknote,
    ShieldCheck,
    Armchair,
    Clock,
    Headphones,
    Map
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
        icon: Headphones,
        title: "24/7 Поддержка",
        description: "Наш диспетчер всегда на связи, чтобы помочь с любым вопросом в любое время суток."
    },
    {
        icon: Map,
        title: "Любые расстояния",
        description: "Комфортные поездки в другие города, аэропорты и регионы. Мы прокладываем оптимальный маршрут."
    }
];

export default function WhyChooseUs() {
    return (
        <section className={styles.section} id="why-choose-us">
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
