"use client";

import styles from './Tariffs.module.css';
import Image from 'next/image';

const tariffs = [
    {
        name: "Эконом",
        price: "от 25 ₽/км",
        description: "Для бюджетных поездок налегке. Лучшая цена без потери качества обслуживания.",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop", // Volkswagen Polo approx
        features: ["Иномарки не старше 5 лет", "Кондиционер", "Детское кресло (по запросу)"]
    },
    {
        name: "Стандарт",
        price: "от 30 ₽/км",
        description: "Оптимальный выбор для дальних поездок. Просторный багажник и комфорт в пути.",
        image: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=600&auto=format&fit=crop", // Skoda Octavia style
        features: ["Skoda Octavia / Kia Cerato", "Вместительный багажник", "Климат-контроль"]
    },
    {
        name: "Комфорт+",
        price: "от 35 ₽/км",
        description: "Повышенный комфорт, просторный салон, зарядка телефона и тишина в салоне.",
        image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=600&auto=format&fit=crop", // Camry style
        features: ["Toyota Camry / Kia K5", "Зарядка для устройств", "Вода в салоне"]
    },
    {
        name: "Бизнес",
        price: "от 40 ₽/км",
        description: "Премиум автомобили, кожаный салон, вода, деловой стиль вождения.",
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop", // Mercedes E-Class style
        features: ["Mercedes E-Class / BMW 5", "Премиальная акустика", "Деловой дресс-код водителя"]
    },
    {
        name: "Минивэн",
        price: "от 45 ₽/км",
        description: "Для больших компаний или семьи с багажом. Комфортная поездка до 7 человек.",
        image: "https://images.unsplash.com/photo-1605218427360-69277af23351?q=80&w=600&auto=format&fit=crop", // V-Class style
        features: ["До 7-8 мест", "Огромный багажник", "Кондиционер для заднего ряда"]
    },
    {
        name: "Трезвый водитель",
        price: "от 120 ₽/км",
        description: "Безопасная доставка вас и вашего автомобиля в любую точку.",
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=600&auto=format&fit=crop", // Generic driving
        features: ["Профессиональный драйвер", "Страховка включена", "Быстрая подача"]
    }
];

export default function Tariffs() {
    return (
        <section className={styles.section} id="tariffs">
            <div className="container">
                <div className={styles.titleWrapper}>
                    <h2 className="section-title">Наши Тарифы</h2>
                    <p className="section-subtitle">Выберите автомобиль, походящий именно вам</p>
                </div>

                <div className={styles.grid}>
                    {tariffs.map((tariff, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                {/* Using standard img for now to avoid Next.js Image config domain issues, or configure next.config.ts */}
                                {/* layout="fill" requires parent relative position */}
                                <Image
                                    src={tariff.image}
                                    alt={tariff.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className={styles.image}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                            <div className={styles.content}>
                                <div className={styles.header}>
                                    <h3 className={styles.name}>{tariff.name}</h3>
                                    <span className={styles.price}>{tariff.price}</span>
                                </div>
                                <p className={styles.description}>{tariff.description}</p>
                                <ul className={styles.features}>
                                    {tariff.features.map((feature, i) => (
                                        <li key={i} className={styles.feature}>{feature}</li>
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
