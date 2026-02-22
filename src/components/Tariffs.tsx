"use client";

import styles from './Tariffs.module.css';

import { useCity } from '@/context/CityContext';
import { cityTariffs, CityTariffs } from '@/data/tariffs';

const tariffDefs = [
    {
        id: "econom" as keyof CityTariffs,
        name: "Эконом",
        description: "Для бюджетных поездок налегке. Лучшая цена без потери качества.",
        image: "/images/tariffs/economy-dark-new.webp?v=3",
        features: ["Гранта, Логан, Лачетти и аналоги", "Кондиционер", "Детское кресло"]
    },
    {
        id: "standart" as keyof CityTariffs,
        name: "Стандарт",
        description: "Оптимальный выбор для дальних поездок. Просторный багажник и комфорт.",
        image: "/images/tariffs/standard-dark-new.webp?v=3",
        features: ["Рио, Солярис, Поло и аналоги", "Вместительный багажник", "Климат-контроль"]
    },
    {
        id: "comfort" as keyof CityTariffs,
        name: "Комфорт",
        description: "Автомобили C-класса. Улучшенный комфорт и тишина в салоне.",
        image: "/images/tariffs/comfort-new.webp?v=3",
        features: ["Октавия, Элантра, Церато", "Тихий салон", "Плавный ход"]
    },
    {
        id: "comfortPlus" as keyof CityTariffs,
        name: "Комфорт+",
        description: "Автомобили D-класса. Просторный салон и премиум удобство.",
        image: "/images/tariffs/comfort-3d.webp",
        features: ["К5, Камри и аналоги", "Зарядка телефона", "Мягкая подвеска"]
    },
    {
        id: "business" as keyof CityTariffs,
        name: "Бизнес",
        description: "Премиум автомобили, кожаный салон, вода, деловой стиль вождения.",
        image: "/images/tariffs/business-3d.webp",
        features: ["Мерседес, БМВ, Ауди", "Премиальный сервис", "Дресс-код водителя"]
    },
    {
        id: "minivan" as keyof CityTariffs,
        name: "Минивэн",
        description: "Для больших компаний или семьи с багажом. Вместимость до 7-8 человек.",
        image: "/images/tariffs/minivan-v2.webp",
        features: ["Карнивал, Старекс и аналоги", "Огромный багажник", "Климат для заднего ряда"]
    },
    {
        id: "soberDriver" as keyof CityTariffs,
        name: "Трезвый водитель",
        description: "Наш профессиональный водитель безопасно доставит вас и ваш автомобиль домой.",
        image: "/images/tariffs/sober-3d.webp",
        features: ["Опытные профессионалы", "Бережное вождение", "Безопасность авто"]
    },
    {
        id: "delivery" as keyof CityTariffs,
        name: "Доставка",
        description: "Быстрая и надежная доставка посылок, документов и малогабаритных грузов.",
        image: "/images/tariffs/delivery-3d.webp",
        features: ["От двери до двери", "Гарантия сохранности", "Срочная отправка"]
    }
];

// Tariffs.tsx partial update
import { Check } from 'lucide-react';

// ... imports

export default function Tariffs() {
    const { currentCity, setSelectedTariff } = useCity();

    // Safe fallback to 'Москва' if city is somehow completely missing
    const activeTariffs = cityTariffs[currentCity?.name] || cityTariffs['Москва'];

    // Adjust individual scales to visually align cars with different intrinsic bounds
    const getStyleProps = (id: string) => {
        const props: any = { '--hover-translate': '-10px' };
        switch (id) {
            case 'econom': props['--base-scale'] = 1.4; props['--hover-scale'] = 1.5; props['--base-translate'] = '-5px'; break;
            case 'standart': props['--base-scale'] = 1.0; props['--hover-scale'] = 1.1; props['--base-translate'] = '0px'; break;
            case 'comfort': props['--base-scale'] = 1.35; props['--hover-scale'] = 1.45; props['--base-translate'] = '0px'; break;
            case 'comfortPlus': props['--base-scale'] = 1.25; props['--hover-scale'] = 1.35; props['--base-translate'] = '-5px'; break;
            case 'business': props['--base-scale'] = 1.15; props['--hover-scale'] = 1.25; props['--base-translate'] = '0px'; break;
            case 'minivan': props['--base-scale'] = 1.45; props['--hover-scale'] = 1.55; props['--base-translate'] = '-5px'; break;
            case 'soberDriver': props['--base-scale'] = 1.0; props['--hover-scale'] = 1.1; props['--base-translate'] = '0px'; props['--hover-translate'] = '-5px'; break;
            case 'delivery': props['--base-scale'] = 1.4; props['--hover-scale'] = 1.5; props['--base-translate'] = '-15px'; props['--hover-translate'] = '-20px'; break;
            default: props['--base-scale'] = 1.25; props['--hover-scale'] = 1.35; props['--base-translate'] = '-5px'; break;
        }
        return props as React.CSSProperties;
    };

    return (
        <section className={`${styles.section} animate-on-scroll`} id="tariffs">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": `Тарифы на межгородское такси из города ${currentCity?.name || 'Москва'}`,
                        "itemListElement": tariffDefs.map((t, i) => ({
                            "@type": "ListItem",
                            "position": i + 1,
                            "item": {
                                "@type": "Service",
                                "name": `Тариф ${t.name}`,
                                "description": t.description,
                                "provider": {
                                    "@type": "Organization",
                                    "name": "GrandTransfer"
                                },
                                "offers": {
                                    "@type": "Offer",
                                    "price": activeTariffs[t.id] || 25,
                                    "priceCurrency": "RUB",
                                    "description": t.id === 'delivery' ? 'Фиксированная цена от' : 'Цена за километр'
                                }
                            }
                        }))
                    })
                }}
            />
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
                                            alt={`Автомобиль класса ${tariff.name} для междугороднего такси и трансфера: ${tariff.features[0]}`}
                                            className={styles.image}
                                            style={getStyleProps(tariff.id)}
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
                                        <div className={styles.priceBadge}>
                                            {(tariff.id === 'delivery' || tariff.id === 'soberDriver') ? 'от 1500 ₽*' : `от ${price} ₽/км`}
                                        </div>
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

                                    <button
                                        className={styles.bookButton}
                                        onClick={() => {
                                            setSelectedTariff(tariff.id);
                                            const element = document.getElementById('booking-form');
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        Заказать
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
