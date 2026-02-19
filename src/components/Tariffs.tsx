"use client";

import styles from './Tariffs.module.css';

const tariffs = [
    {
        name: "Эконом",
        price: "от 25 ₽/км",
        description: "Для бюджетных поездок налегке. Лучшая цена без потери качества обслуживания.",
        image: "/images/tariffs/economy.svg",
        features: ["Иномарки не старше 5 лет", "Кондиционер", "Детское кресло (по запросу)"]
    },
    {
        name: "Стандарт",
        price: "от 30 ₽/км",
        description: "Оптимальный выбор для дальних поездок. Просторный багажник и комфорт в пути.",
        image: "/images/tariffs/standard.svg",
        features: ["Skoda Octavia / Kia Cerato", "Вместительный багажник", "Климат-контроль"]
    },
    {
        name: "Комфорт+",
        price: "от 35 ₽/км",
        description: "Повышенный комфорт, просторный салон, зарядка телефона и тишина в салоне.",
        image: "/images/tariffs/comfort.svg",
        features: ["Toyota Camry / Kia K5", "Зарядка для устройств", "Вода в салоне"]
    },
    {
        name: "Бизнес",
        price: "от 40 ₽/км",
        description: "Премиум автомобили, кожаный салон, вода, деловой стиль вождения.",
        image: "/images/tariffs/business.svg",
        features: ["Mercedes E-Class / BMW 5", "Премиальная акустика", "Деловой дресс-код водителя"]
    },
    {
        name: "Минивэн",
        price: "от 45 ₽/км",
        description: "Для больших компаний или семьи с багажом. Комфортная поездка до 7 человек.",
        image: "/images/tariffs/minivan.svg",
        features: ["До 7-8 мест", "Огромный багажник", "Кондиционер для заднего ряда"]
    },
    {
        name: "Трезвый водитель",
        price: "от 120 ₽/км",
        description: "Безопасная доставка вас и вашего автомобиля в любую точку.",
        image: "/images/tariffs/sober.svg",
        features: ["Профессиональный драйвер", "Страховка включена", "Быстрая подача"]
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
                                <h3 className={styles.name}>{tariff.name}</h3>
                                <div className={styles.cars}>{tariff.features[0]}</div>
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
