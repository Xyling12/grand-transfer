"use client";

import { useRef } from 'react';
import styles from './Reviews.module.css';
import { Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const REVIEWS = [
    {
        name: "Алексей С.",
        date: "12 октября 2025",
        rating: 5,
        text: "Заказывал минивэн для поездки с семье в аэропорт Казани. Водитель приехал заранее, помог с багажом. Машина чистая, просторная. Доехали с комфортом, дети даже поспали. Рекомендую!",
        initial: "А"
    },
    {
        name: "Сергей Г.",
        date: "2 ноября 2025",
        rating: 5,
        text: "Ехали из Минвод в Домбай с горнолыжной снаряжей. Заказывали минивэн. Всё влезло без проблем, водитель ехал очень аккуратно, машина теплая. Никаких доплат за багаж не взяли.",
        initial: "С"
    },
    {
        name: "Елена П.",
        date: "18 ноября 2025",
        rating: 4,
        text: "Заказывала комфорт+ из аэропорта в Пятигорск. Водитель встретил с табличкой, вежливый. Единственный минус - на выезде из аэропорта была небольшая пробка, но доехали с комфортом. В целом довольна.",
        initial: "Е"
    },
    {
        name: "Марина В.",
        date: "28 сентября 2025",
        rating: 5,
        text: "Пользуюсь услугами GrandTransfer для командировок. Всегда всё четко: отчетные документы предоставляют, водители вежливые, в салоне вода и зарядка. Сервис на высоте.",
        initial: "М"
    },
    {
        name: "Владимир М.",
        date: "10 декабря 2025",
        rating: 5,
        text: "Отличный сервис! Нужно было срочно уехать ночью из Ставрополя в Ростов. Машина была подана ровно в срок, водитель настоящий профессионал. Буду пользоваться еще.",
        initial: "В"
    },
    {
        name: "Игорь Т.",
        date: "5 января 2026",
        rating: 4,
        text: "Хорошее такси. Цены чуть выше обычных агрегаторов, но за уверенность и комфортную машину (приехала новая Камри) оно того стоит. Доехали в Кисловодск безопасно.",
        initial: "И"
    },
    {
        name: "Дмитрий К.",
        date: "5 ноября 2025",
        rating: 5,
        text: "Нужно было срочно отправить документы партнерам в Уфу. Ребята организовали доставку день в день. Очень выручили! Цена адекватная за такую оперативность.",
        initial: "Д"
    },
    {
        name: "Юля С.",
        date: "20 января 2026",
        rating: 5,
        text: "Спасибо за шикарную поездку в Архыз! Бронировали заранее на сайте, диспетчер быстро подтвердил. Автомобиль с мягкой подвеской, нас вообще не укачало на серпантинах.",
        initial: "Ю"
    },
    {
        name: "Николай В.",
        date: "14 января 2026",
        rating: 4,
        text: "Всё отлично, довезли быстро и безопасно. Водитель немного не сразу нашел наш адрес в частном секторе при подаче, пришлось минут пять его по навигатору направлять. Но в остальном - супер.",
        initial: "Н"
    },
    {
        name: "Михаил О.",
        date: "2 февраля 2026",
        rating: 5,
        text: "Регулярно езжу по работе. У Гранд Трансфер всегда есть свободные машины бизнес-класса, можно спокойно поработать с ноутбуком на заднем сиденье. Тихо, чисто, профессионально.",
        initial: "М"
    },
    {
        name: "Олег Р.",
        date: "11 февраля 2026",
        rating: 5,
        text: "Заказывал услугу трезвого водителя после юбилея. Водитель приехал за 15 минут, довез мою машину очень аккуратно. Большое спасибо за сохраненные нервы и права!",
        initial: "О"
    },
    {
        name: "Светлана Д.",
        date: "15 февраля 2026",
        rating: 5,
        text: "Ездили с двумя маленькими детьми в санаторий в Ессентуки. Предоставили два отличных чистых детских кресла, помогли с коляской и багажом. Очень заботливое отношение к клиентам!",
        initial: "С"
    },
    {
        name: "Анна И.",
        date: "18 февраля 2026",
        rating: 4,
        text: "Заказывали гостям трансфер на мероприятие. Все прошло хорошо, микроавтобусы приехали вовремя. Сняла одну звезду за то, что в одной из машин не сразу заработал кондиционер в салоне сзади.",
        initial: "А"
    }
];

// Placeholder link - user can change this later
const REVIEWS_LINK = "https://yandex.ru/maps";

export default function Reviews() {
    const carouselRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const firstCard = carouselRef.current.firstElementChild as HTMLElement;
            const cardWidth = firstCard?.offsetWidth || 320;
            const scrollAmount = cardWidth + 30; // Card width + CSS gap

            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className={`${styles.section} animate-on-scroll`} id="reviews">
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h2 className="section-title">Отзывы клиентов</h2>
                        <p className="section-subtitle">Нам доверяют свои поездки более 5000 клиентов</p>
                    </div>

                    <div className={styles.navButtons}>
                        <button className={styles.navBtn} onClick={() => scroll('left')} aria-label="Предыдущие отзывы">
                            <ChevronLeft size={24} />
                        </button>
                        <button className={styles.navBtn} onClick={() => scroll('right')} aria-label="Следующие отзывы">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className={styles.carouselContainer}>
                    <div className={styles.grid} ref={carouselRef}>
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
