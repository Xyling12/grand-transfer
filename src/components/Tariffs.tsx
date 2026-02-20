"use client";

import styles from './Tariffs.module.css';

import { useCity } from '@/context/CityContext';
import { cityTariffs, CityTariffs } from '@/data/tariffs';

const tariffDefs = [
    {
        id: "econom" as keyof CityTariffs,
        name: "Эконом",
        description: "Для бюджетных поездок налегке. Лучшая цена без потери качества.",
        image: "/images/tariffs/economy-3d.png",
        features: ["Гранта, Логан, Лачетти и аналоги", "Кондиционер", "Детское кресло"]
    },
    {
        id: "standart" as keyof CityTariffs,
        name: "Стандарт",
        description: "Оптимальный выбор для дальних поездок. Просторный багажник и комфорт.",
        image: "/images/tariffs/standard-3d.png",
        features: ["Рио, Солярис, Поло и аналоги", "Вместительный багажник", "Климат-контроль"]
    },
    {
        id: "comfortPlus" as keyof CityTariffs,
        name: "Комфорт+",
        description: "Автомобили D-класса. Просторный салон и премиум удобство.",
        image: "/images/tariffs/comfort-3d.png",
        features: ["К5, Камри и аналоги", "Зарядка телефона", "Мягкая подвеска"]
    },
    {
        id: "business" as keyof CityTariffs,
        name: "Бизнес",
        description: "Премиум автомобили, кожаный салон, вода, деловой стиль вождения.",
        image: "/images/tariffs/business-3d.png",
        features: ["Мерседес, БМВ, Ауди", "Премиальный сервис", "Дресс-код водителя"]
    },
    {
        id: "minivan" as keyof CityTariffs,
        name: "Минивэн",
        description: "Для больших компаний или семьи с багажом. Вместимость до 7-8 человек.",
        image: "/images/tariffs/minivan-3d.png",
        features: ["Карнивал, Старекс и аналоги", "Огромный багажник", "Климат для заднего ряда"]
    },
    {
        id: "soberDriver" as keyof CityTariffs,
        name: "Трезвый водитель",
        description: "Наш профессиональный водитель безопасно доставит вас и ваш автомобиль домой.",
        image: "/images/tariffs/sober-3d.png",
        features: ["Опытные профессионалы", "Бережное вождение", "Безопасность авто"]
    }
];

// Tariffs.tsx partial update
import { Check } from 'lucide-react';

// ... imports

export default function Tariffs() {
    const { currentCity } = useCity();

    // Safe fallback to 'Москва' if city is somehow completely missing
    const activeTariffs = cityTariffs[currentCity?.name] || cityTariffs['Москва'];

    return (
        <section className={`${styles.section} animate-on-scroll`} id="tariffs">
            <div className="container">
                <div className={styles.titleWrapper}>
                    <h2 className="section-title">Наши Тарифы</h2>
                    <p className="section-subtitle">Выберите автомобиль, подходящий именно вам</p>
                </div>

                <div className={styles.grid}>
                    {tariffDefs.map((tariff, index) => {
                        const price = activeTariffs[tariff.id] || 25;

                        return (
                            <div key={index} className={styles.card}>
                                {/* Dark Header */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.imageWrapper}>
                                        <img
                                            src={tariff.image}
                                            alt={tariff.name}
                                            className={styles.image}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className={styles.nameRow}>
                                        <h3 className={styles.name}>{tariff.name}</h3>
                                        <div className={styles.cars}>{tariff.features[0]}</div>
                                    </div>
                                </div>

                                {/* Light Body */}
                                <div className={styles.cardBody}>
                                    <div className={styles.headerRow}>
                                        <h4 className={styles.nameAlt}>{tariff.name}</h4>
                                        <div className={styles.priceBadge}>от {price} ₽/км</div>
                                    </div>

                                    <p className={styles.description}>{tariff.description}</p>

                                    <ul className={styles.features}>
                                        {tariff.features.map((feature, i) => (
                                            <li key={i} className={styles.feature}>
                                                <Check size={16} className={styles.featureIcon} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button className={styles.bookButton}>Заказать</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
