"use client";

import styles from './Reviews.module.css';
import { Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const REVIEWS = [
    {
        name: "Алексей С.",
        date: "12 октября 2025",
        rating: 5,
        text: "Заказывал минивэн для поездки с семьей в аэропорт Казани. Водитель приехал заранее, помог с багажом. Машина чистая, просторная. Доехали с комфортом, дети даже поспали. Рекомендую!",
        initial: "А"
    },
    {
        name: "Марина В.",
        date: "28 сентября 2025",
        rating: 5,
        text: "Пользуюсь услугами GrandTransfer для командировок в Самару. Всегда всё четко: отчетные документы предоставляют, водители вежливые, в салоне вода и зарядка. Сервис на высоте.",
        initial: "М"
    },
    {
        name: "Дмитрий К.",
        date: "5 ноября 2025",
        rating: 5,
        text: "Нужно было срочно отправить документы партнерам в Уфу. Ребята организовали доставку день в день. Очень выручили! Цена адекватная за такую оперативность.",
        initial: "Д"
    }
];

// Placeholder link - user can change this later
const REVIEWS_LINK = "https://yandex.ru/maps";

export default function Reviews() {
    return (
        <section className={`${styles.section} animate-on-scroll`} id="reviews">
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className="section-title">Отзывы клиентов</h2>
                    <p className="section-subtitle">Нам доверяют свои поездки более 5000 клиентов</p>
                </div>

                <div className={styles.grid}>
                    {REVIEWS.map((review, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.quoteIcon}>“</div>
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>{review.initial}</div>
                                <div className={styles.meta}>
                                    <span className={styles.name}>{review.name}</span>
                                    <span className={styles.date}>{review.date}</span>
                                </div>
                            </div>
                            <div className={styles.stars}>
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        fill={i < review.rating ? "currentColor" : "none"}
                                        strokeWidth={i < review.rating ? 0 : 2}
                                    />
                                ))}
                            </div>
                            <p className={styles.text}>{review.text}</p>
                        </div>
                    ))}
                </div>

                <div className={styles.actions}>
                    <a href={REVIEWS_LINK} target="_blank" rel="noopener noreferrer" className={styles.button}>
                        Читать все отзывы <ExternalLink size={18} />
                    </a>
                </div>
            </div>
        </section>
    );
}
