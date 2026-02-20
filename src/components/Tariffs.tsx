"use client";

import styles from './Tariffs.module.css';

const tariffs = [
    {
        name: "Эконом",
        price: "от 25 ₽/км",
        description: "Для бюджетных поездок налегке. Лучшая цена без потери качества.",
        image: "/images/tariffs/economy-3d.png",
        features: ["Гранта, Логан, Лачетти и аналоги", "Кондиционер", "Детское кресло"]
    },
    {
        name: "Стандарт",
        price: "от 30 ₽/км",
        description: "Оптимальный выбор для дальних поездок. Просторный багажник и комфорт.",
        image: "/images/tariffs/standard-3d.png",
        features: ["Рио, Солярис, Поло и аналоги", "Вместительный багажник", "Климат-контроль"]
    },
    {
        name: "Комфорт",
        price: "от 35 ₽/км",
        description: "Повышенный комфорт, просторный салон и тишина в пути.",
        image: "/images/tariffs/comfort-3d.png",
        features: ["Октавия, Джетта, Церато и аналоги", "Зарядка телефона", "Мягкая подвеска"]
    },
    {
        name: "Комфорт+",
        price: "от 40 ₽/км",
        description: "Автомобили D-класса. Просторный кожаный салон и премиум удобство.",
        image: "/images/tariffs/business-3d.png",
        features: ["К5, Камри и аналоги", "Премиальная акустика", "Вода в салоне"]
    },
    {
        name: "Минивэн",
        price: "от 45 ₽/км",
        description: "Для больших компаний или семьи с багажом. Вместимость до 7-8 человек.",
        image: "/images/tariffs/minivan-3d.png",
        features: ["Карнивал, Старекс и аналоги", "Огромный багажник", "Климат для заднего ряда"]
    },
    {
        name: "Бизнес",
        price: "от 50 ₽/км",
        description: "Премиум автомобили, кожаный салон, вода, деловой стиль вождения.",
        image: "/images/tariffs/business-3d.png",
        features: ["Мерседес, БМВ, Ауди", "Премиальный сервис", "Дресс-код водителя"]
    }
];

// Tariffs.tsx partial update
import { Check } from 'lucide-react';

// ... imports

export default function Tariffs() {
    return (
        <section className={`${styles.section} animate-on-scroll`} id="tariffs">
            <div className="container">
                <div className={styles.titleWrapper}>
                    <h2 className="section-title">Наши Тарифы</h2>
                    <p className="section-subtitle">Выберите автомобиль, подходящий именно вам</p>
                </div>

                <div className={styles.grid}>
                    {tariffs.map((tariff, index) => (
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
                                    <div className={styles.priceBadge}>{tariff.price}</div>
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
                    ))}
                </div>
            </div>
        </section>
    );
}
