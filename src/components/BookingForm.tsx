"use client";
// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, User, Phone, ChevronRight, ChevronLeft, CheckCircle2, Navigation, Ruler, Clock3, Loader2, Calendar, Clock } from 'lucide-react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import styles from './BookingForm.module.css';
import { useCity } from '@/context/CityContext';

const TARIFFS = [
    { id: 'econom', name: 'Эконом', price: 'от 25 ₽', pricePerKm: 25, image: '/images/tariffs/economy-3d.png' },
    { id: 'standart', name: 'Стандарт', price: 'от 30 ₽', pricePerKm: 30, image: '/images/tariffs/standard-3d.png' },
    { id: 'comfort', name: 'Комфорт+', price: 'от 35 ₽', pricePerKm: 35, image: '/images/tariffs/comfort-3d.png' },
    { id: 'business', name: 'Бизнес', price: 'от 40 ₽', pricePerKm: 40, image: '/images/tariffs/business-3d.png' },
    { id: 'minivan', name: 'Минивэн', price: 'от 45 ₽', pricePerKm: 45, image: '/images/tariffs/minivan-3d.png' },
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

    // Route Calculation State
    const [priceCalc, setPriceCalc] = useState<{ roadKm: number; minPrice: number; duration: string; tariffName: string; } | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [ymapsInstance, setYmapsInstance] = useState<any>(null);
    const [routeRenderData, setRouteRenderData] = useState<any>(null);

    // Form Refs for SuggestView
    const fromInputRef = useRef<HTMLInputElement>(null);
    const toInputRef = useRef<HTMLInputElement>(null);

    // Calculate real route using Yandex Maps API when cities change
    useEffect(() => {
        if (!ymapsInstance || !fromCity || !toCity) {
            if (!fromCity || !toCity) setPriceCalc(null);
            return;
        }

        setIsCalculatingRoute(true);

        ymapsInstance.route([fromCity, toCity], {
            multiRoute: true,
            routingMode: 'auto'
        }).then((route: unknown) => {
            const ymapsRoute = route as Record<string, unknown>;
            if (typeof ymapsRoute.getActiveRoute !== 'function') return;
            const getActiveRouteFn = ymapsRoute.getActiveRoute as (...args: any[]) => any;
            const activeRoute = getActiveRouteFn();
            if (!activeRoute) {
                setPriceCalc(null);
                setIsCalculatingRoute(false);
                return;
            }

            const distanceInMeters = activeRoute.properties.get("distance").value;
            const durationInSeconds = activeRoute.properties.get("duration").value;

            const roadKm = Math.round(distanceInMeters / 1000);

            const hours = Math.floor(durationInSeconds / 3600);
            const mins = Math.round((durationInSeconds % 3600) / 60);
            const duration = hours === 0 ? `${mins} мин` : mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;

            const selectedTariff = TARIFFS.find(t => t.id === tariff);
            const rate = selectedTariff?.pricePerKm ?? 25;
            const minPrice = Math.round((500 + roadKm * rate) / 100) * 100;

            setPriceCalc({ roadKm, minPrice, duration, tariffName: selectedTariff?.name || '' });
            setRouteRenderData(route);
            setIsCalculatingRoute(false);
        }).catch((err: unknown) => {
            console.error('Yandex route error', err);
            setPriceCalc(null);
            setIsCalculatingRoute(false);
        });
    }, [fromCity, toCity, tariff, ymapsInstance]);


    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [passengers, setPassengers] = useState(1);

    // Attach SuggestView to inputs when YMaps loads
    const onLoadYmaps = useCallback((ymaps: unknown) => {
        const ymapsAny = ymaps as any;
        if (!ymapsAny) return;
        setYmapsInstance(ymapsAny);

        if (fromInputRef.current) {
            const ymapsAny = ymaps as Record<string, any>;
            const suggestFrom = new ymapsAny.SuggestView(fromInputRef.current, { results: 5 });
            suggestFrom.events.add('select', (e: unknown) => {
                const eventAny = e as Record<string, unknown>;
                if (typeof eventAny.get === 'function') {
                    const getFn = eventAny.get as (...args: any[]) => any;
                    setFromCity(getFn('item').value);
                }
            });
        }
        if (toInputRef.current) {
            const ymapsAny = ymaps as Record<string, any>;
            const suggestTo = new ymapsAny.SuggestView(toInputRef.current, { results: 5 });
            suggestTo.events.add('select', (e: unknown) => {
                const eventAny = e as Record<string, unknown>;
                if (typeof eventAny.get === 'function') {
                    const getFn = eventAny.get as (...args: any[]) => any;
                    setToCity(getFn('item').value);
                }
            });
        }
    }, [fromInputRef, toInputRef]);

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
                                                ref={fromInputRef}
                                                type="text"
                                                className={styles.input}
                                                placeholder="Улица, дом или город"
                                                value={fromCity}
                                                onChange={(e) => setFromCity(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Куда</label>
                                        <div className={styles.inputWrapper}>
                                            <MapPin size={18} className={styles.icon} />
                                            <input
                                                ref={toInputRef}
                                                type="text"
                                                className={styles.input}
                                                placeholder="Куда едем? (Город, адрес)"
                                                value={toCity}
                                                onChange={(e) => setToCity(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Yandex Map Preview */}
                                <YMaps query={{ apikey: 'd6af2cbb-9bf6-419b-a010-0937a76e48ab', load: 'package.full' }}>
                                    <div style={{ display: 'none' }}>
                                        {/* Hidden Map just to load ymaps library globally for SuggestView */}
                                        <Map defaultState={{ center: [55.751574, 37.573856], zoom: 9 }} onLoad={onLoadYmaps} />
                                    </div>
                                    {
                                        routeRenderData && (
                                            <div style={{
                                                marginTop: '20px',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                height: '320px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                border: '1px solid var(--glass-border)'
                                            }}>
                                                <Map
                                                    state={{ center: [0, 0], bounds: routeRenderData.getBounds(), zoom: 9 }}
                                                    options={{ suppressMapOpenBlock: true }}
                                                    width="100%"
                                                    height="100%"
                                                    instanceRef={ref => {
                                                        if (ref && routeRenderData) {
                                                            ref.geoObjects.removeAll();
                                                            ref.geoObjects.add(routeRenderData);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )
                                    }
                                </YMaps >

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Выберите тариф</label>
                                    <div className={styles.tariffGrid}>
                                        {TARIFFS.map((t) => (
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
                                                    <span className={styles.tariffPrice}>{t.price}/км</span>
                                                </div>
                                            </div>
                                        ))}
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
