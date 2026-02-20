"use client";
// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, User, Phone, ChevronRight, ChevronLeft, CheckCircle2, Navigation, Ruler, Clock3, Loader2, Calendar, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import LeafletSuggestInput from './LeafletSuggestInput';

const LeafletMapPreview = dynamic(() => import('./LeafletMapPreview'), {
    ssr: false,
    loading: () => <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: '16px' }}><Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} /></div>
});
import styles from './BookingForm.module.css';
import { useCity } from '@/context/CityContext';
import { cityTariffs, CityTariffs } from '@/data/tariffs';

const TARIFFS = [
    { id: 'econom', name: 'Эконом', image: '/images/tariffs/economy-3d.png' },
    { id: 'standart', name: 'Стандарт', image: '/images/tariffs/standard-3d.png' },
    { id: 'comfortPlus', name: 'Комфорт+', image: '/images/tariffs/comfort-3d.png' },
    { id: 'business', name: 'Бизнес', image: '/images/tariffs/business-3d.png' },
    { id: 'minivan', name: 'Минивэн', image: '/images/tariffs/minivan-3d.png' },
    { id: 'soberDriver', name: 'Трезвый водитель', image: '/images/tariffs/sober-3d.png' },
];

function haversineDistance(coords1: [number, number], coords2: [number, number]) {
    const R = 6371; // Earth radius in km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.3; // +30% to approximate road distance
}

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

    // Route Calculation State
    const [priceCalc, setPriceCalc] = useState<{ roadKm: number; minPrice: number; duration: string; tariffName: string; } | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

    // Coordinate state for routing
    const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
    const [toCoords, setToCoords] = useState<[number, number] | null>(null);

    const handleRouteCalculated = useCallback((distanceKm: number, durationSeconds: number) => {
        const roadKm = Math.round(distanceKm);
        const hours = Math.floor(durationSeconds / 3600);
        const mins = Math.round((durationSeconds % 3600) / 60);
        const duration = hours === 0 ? `${mins} мин` : mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;

        const selectedTariff = TARIFFS.find(t => t.id === tariff);
        const activeCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
        const rate = activeCityTariffs[tariff as keyof CityTariffs] || 25;
        const minPrice = Math.round((500 + roadKm * rate) / 100) * 100;

        setPriceCalc({ roadKm, minPrice, duration, tariffName: selectedTariff?.name || '' });
        setIsCalculatingRoute(false);
    }, [tariff, currentCity]);

    // Update price if tariff changes while coords exist
    useEffect(() => {
        if (fromCoords && toCoords && priceCalc) {
            const selectedTariff = TARIFFS.find(t => t.id === tariff);
            const activeCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
            const rate = activeCityTariffs[tariff as keyof CityTariffs] || 25;
            const minPrice = Math.round((500 + priceCalc.roadKm * rate) / 100) * 100;
            setPriceCalc(prev => prev ? { ...prev, minPrice, tariffName: selectedTariff?.name || '' } : null);
        }
    }, [tariff, currentCity]);

    // Clear price if coords missing
    useEffect(() => {
        if (!fromCoords || !toCoords) {
            setPriceCalc(null);
        } else {
            setIsCalculatingRoute(true);
        }
    }, [fromCoords, toCoords]);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [passengers, setPassengers] = useState(1);

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
                                        <label className={styles.label}>Откуда (Город, улица, номер дома)</label>
                                        <div className={styles.inputWrapper}>
                                            <MapPin size={18} className={styles.icon} />
                                            <LeafletSuggestInput
                                                className={styles.input}
                                                placeholder="г. Москва, ул. Ленина, д. 1"
                                                value={fromCity}
                                                onChange={(e) => setFromCity(e.target.value)}
                                                onSuggestSelect={(text, coords) => {
                                                    setFromCity(text);
                                                    setFromCoords(coords);
                                                }}
                                                cityContext={currentCity?.name}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Куда (Город, улица, номер дома)</label>
                                        <div className={styles.inputWrapper}>
                                            <MapPin size={18} className={styles.icon} />
                                            <LeafletSuggestInput
                                                className={styles.input}
                                                placeholder="г. Казань, ул. Баумана, д. 2"
                                                value={toCity}
                                                onChange={(e) => setToCity(e.target.value)}
                                                onSuggestSelect={(text, coords) => {
                                                    setToCity(text);
                                                    setToCoords(coords);
                                                }}
                                                cityContext={currentCity?.name}
                                            />
                                        </div>
                                    </div>
                                    <p className={styles.priceHint} style={{ gridColumn: '1 / -1', marginTop: '-10px', opacity: 0.8 }}>
                                        <small>* Начните вводить точный адрес, и нажмите на подходящую подсказку из поиска.</small>
                                    </p>
                                </div>

                                <div style={{
                                    marginTop: '20px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    height: '320px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    border: '1px solid var(--glass-border)',
                                    width: '100%',
                                    position: 'relative',
                                    zIndex: 0
                                }}>
                                    <LeafletMapPreview
                                        fromCoords={fromCoords}
                                        toCoords={toCoords}
                                        onRouteCalculated={handleRouteCalculated}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Выберите тариф</label>
                                    <div className={styles.tariffGrid}>
                                        {TARIFFS.map((t) => {
                                            const activeCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
                                            const itemPrice = activeCityTariffs[t.id as keyof CityTariffs] || 25;

                                            return (
                                                <div
                                                    key={t.id}
                                                    className={`${styles.tariffCard} ${tariff === t.id ? styles.tariffActive : ''}`}
                                                    onClick={() => setTariff(t.id)}
                                                >
                                                    {tariff === t.id && <CheckCircle2 size={16} className={styles.checkIcon} />}
                                                    <div className={styles.carImageWrapper}>
                                                        <img src={t.image} alt={t.name} className={styles.carImage} />
                                                    </div>
                                                    <div className={styles.tariffCardBody}>
                                                        <span className={styles.tariffName}>{t.name}</span>
                                                        <span className={styles.tariffPrice}>от {itemPrice} ₽/км</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Price Calculator Result */}
                                {
                                    isCalculatingRoute ? (
                                        <div className={styles.priceResult} style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                                            <Loader2 size={32} className={styles.spinner} style={{ animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} />
                                        </div>
                                    ) : priceCalc && (
                                        <div className={styles.priceResult}>
                                            <div className={styles.priceResultHeader}>
                                                <span className={styles.priceResultLabel}>Точный расчёт стоимости</span>
                                                <span className={styles.priceResultTariff}>{priceCalc.tariffName}</span>
                                            </div>
                                            <div className={styles.priceResultStats}>
                                                <div className={styles.priceStat}>
                                                    <Ruler size={15} className={styles.priceStatIcon} />
                                                    <span>{priceCalc.roadKm} км</span>
                                                </div>
                                                <div className={styles.priceStat}>
                                                    <Clock3 size={15} className={styles.priceStatIcon} />
                                                    <span>~{priceCalc.duration}</span>
                                                </div>
                                            </div>
                                            <div className={styles.priceResultTotal}>
                                                от <strong>{priceCalc.minPrice.toLocaleString('ru-RU')} ₽</strong>
                                            </div>
                                        </div>
                                    )
                                }

                                {
                                    !priceCalc && fromCity && toCity && (
                                        <div className={styles.priceHint}>
                                            <Navigation size={14} />
                                            Укажите города из списка для предварительного расчёта цены
                                        </div>
                                    )
                                }

                                <div className={styles.actions}>
                                    <button type="button" className={styles.nextBtn} onClick={() => setStep(2)}>
                                        Далее <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                    </button>
                                </div>
                            </>
                        )}

                        {
                            step === 2 && (
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
                            )
                        }
                    </form >
                </div >
            </div >
        </section >
    );
}
