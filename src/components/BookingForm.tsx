"use client";

import { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, User, Phone, Users, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import styles from './BookingForm.module.css';
import { useCity } from '@/context/CityContext';
import { cities } from '@/data/cities';

const CITIES = ["Москва", "Казань", "Уфа", "Самара", "Набережные Челны", "Нижний Новгород", "Санкт-Петербург", "Сочи", "Адлер", "Екатеринбург", "Челябинск", "Пермь"];

const TARIFFS = [
    { id: 'econom', name: 'Эконом', price: 'от 25 ₽', image: '/images/tariffs/economy.svg' },
    { id: 'standart', name: 'Стандарт', price: 'от 30 ₽', image: '/images/tariffs/standard.svg' },
    { id: 'comfort', name: 'Комфорт+', price: 'от 35 ₽', image: '/images/tariffs/comfort.svg' },
    { id: 'business', name: 'Бизнес', price: 'от 40 ₽', image: '/images/tariffs/business.svg' },
    { id: 'minivan', name: 'Минивэн', price: 'от 45 ₽', image: '/images/tariffs/minivan.svg' },
];

export default function BookingForm() {
    const { currentCity } = useCity();
    const [step, setStep] = useState(1);

    // Form State
    const [fromCity, setFromCity] = useState(currentCity?.name || '');

    // Update form when city changes globally
    useEffect(() => {
        if (currentCity) {
            setFromCity(currentCity.name);
        }
    }, [currentCity]);

    const [toCity, setToCity] = useState('');
    const [tariff, setTariff] = useState('standart');

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [comment, setComment] = useState('');

    // Suggestions State
    const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
    const [toSuggestions, setToSuggestions] = useState<string[]>([]);
    const [showFromSuggestions, setShowFromSuggestions] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);

    // Autocomplete Logic
    const handleCityChange = (val: string, type: 'from' | 'to') => {
        if (type === 'from') {
            setFromCity(val);
            if (val.length > 1) {
                setFromSuggestions(CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())));
                setShowFromSuggestions(true);
            } else {
                setShowFromSuggestions(false);
            }
        } else {
            setToCity(val);
            if (val.length > 1) {
                setToSuggestions(CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())));
                setShowToSuggestions(true);
            } else {
                setShowToSuggestions(false);
            }
        }
    };

    const selectCity = (city: string, type: 'from' | 'to') => {
        if (type === 'from') {
            setFromCity(city);
            setShowFromSuggestions(false);
        } else {
            setToCity(city);
            setShowToSuggestions(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here we would send data to API
        alert(`Заявка отправлена!\nМаршрут: ${fromCity} -> ${toCity}\nТариф: ${tariff}\nИмя: ${name}\nТелефон: ${phone}`);
    };

    return (
        <section className={`${styles.section} animate-on-scroll`} id="booking-form">
            <div className={styles.container}>
                <div className={styles.formCard}>
                    <div className={styles.stepIndicator}>
                        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepCompleted : ''}`}>1</div>
                        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
                    </div>

                    <h2 className={styles.title}>
                        {step === 1 ? "Рассчитать стоимость" : "Детали поездки"}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <>
                                <div className={styles.grid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Откуда</label>
                                        <div className={styles.inputWrapper}>
                                            <MapPin size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="Город отправления"
                                                value={fromCity}
                                                onChange={(e) => handleCityChange(e.target.value, 'from')}
                                                onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                                            />
                                            {showFromSuggestions && fromSuggestions.length > 0 && (
                                                <div className={styles.suggestions}>
                                                    {fromSuggestions.map((city) => (
                                                        <div key={city} className={styles.suggestionItem} onClick={() => selectCity(city, 'from')}>
                                                            {city}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Куда</label>
                                        <div className={styles.inputWrapper}>
                                            <MapPin size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="Город назначения"
                                                value={toCity}
                                                onChange={(e) => handleCityChange(e.target.value, 'to')}
                                                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                                            />
                                            {showToSuggestions && toSuggestions.length > 0 && (
                                                <div className={styles.suggestions}>
                                                    {toSuggestions.map((city) => (
                                                        <div key={city} className={styles.suggestionItem} onClick={() => selectCity(city, 'to')}>
                                                            {city}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Yandex Map Preview */}
                                {(() => {
                                    const normalize = (s: string) => s.trim().toLowerCase();
                                    const city1 = cities.find(c => normalize(c.name) === normalize(fromCity));
                                    const city2 = cities.find(c => normalize(c.name) === normalize(toCity));

                                    if (city1 && city2 && city1.id !== city2.id) {
                                        // Construct Yandex Maps URL
                                        // rtext=lat1,lon1~lat2,lon2
                                        const rtext = `${city1.lat},${city1.lon}~${city2.lat},${city2.lon}`;
                                        const mapUrl = `https://yandex.ru/map-widget/v1/?rtext=${rtext}&rtt=auto&z=6`;

                                        return (
                                            <div style={{
                                                marginTop: '20px',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                height: '320px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                border: '1px solid var(--color-border)'
                                            }}>
                                                <iframe
                                                    src={mapUrl}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    allowFullScreen={true}
                                                    style={{ display: 'block' }}
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Выберите тариф</label>
                                    <div className={styles.tariffGrid}>
                                        {TARIFFS.map((t) => (
                                            <div
                                                key={t.id}
                                                className={`${styles.tariffCard} ${tariff === t.id ? styles.tariffActive : ''}`}
                                                onClick={() => setTariff(t.id)}
                                            >
                                                {tariff === t.id && <CheckCircle2 size={18} className={styles.checkIcon} />}
                                                <div className={styles.carImageWrapper}>
                                                    <img src={t.image} alt={t.name} className={styles.carImage} />
                                                </div>
                                                <span className={styles.tariffName}>{t.name}</span>
                                                <span className={styles.tariffPrice}>{t.price}/км</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className={styles.nextBtn} onClick={() => setStep(2)}>
                                        Далее <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className={styles.grid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Ваше Имя</label>
                                        <div className={styles.inputWrapper}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="Как к вам обращаться?"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Телефон</label>
                                        <div className={styles.inputWrapper}>
                                            <Phone size={18} className={styles.icon} />
                                            <input
                                                type="tel"
                                                className={styles.input}
                                                placeholder="+7 (999) 000-00-00"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Дата</label>
                                        <div className={styles.inputWrapper}>
                                            <Calendar size={18} className={styles.icon} />
                                            <input
                                                type="date"
                                                className={styles.input}
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Время</label>
                                        <div className={styles.inputWrapper}>
                                            <Clock size={18} className={styles.icon} />
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.label}>Количество пассажиров: {passengers}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="8"
                                            value={passengers}
                                            onChange={(e) => setPassengers(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                                        <ChevronLeft size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> Назад
                                    </button>
                                    <button type="submit" className={styles.nextBtn}>
                                        Заказать Трансфер
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
}
