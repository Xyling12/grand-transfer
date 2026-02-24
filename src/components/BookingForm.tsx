"use client";
// @ts-nocheck

import { useState, useEffect, useCallback, Suspense } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MessageSquare, MapPin, Users, Route, Ruler, Clock3, Navigation, User, Phone, Calendar, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import LeafletSuggestInput from './LeafletSuggestInput';
import { useCity } from '@/context/CityContext';
import { useGeolocationCity } from '@/hooks/useGeolocationCity';
import { cities } from '@/data/cities';

const LeafletMapPreview = dynamic(() => import('./LeafletMapPreview'), {
    ssr: false,
    loading: () => <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: '16px' }}><Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} /></div>
});
import styles from './BookingForm.module.css';
import { cityTariffs, CityTariffs } from '@/data/tariffs';
import { checkpoints, requiresCheckpoint } from '@/data/checkpoints';

const TARIFFS = [
    { id: 'econom', name: 'Эконом', image: '/images/tariffs/economy-3d.webp' },
    { id: 'standart', name: 'Стандарт', image: '/images/tariffs/standard-3d.webp' },
    { id: 'comfort', name: 'Комфорт', image: '/images/tariffs/comfort-3d.webp' },
    { id: 'comfortPlus', name: 'Комфорт+', image: '/images/tariffs/comfort-3d.webp' },
    { id: 'business', name: 'Бизнес', image: '/images/tariffs/business-3d.webp' },
    { id: 'minivan', name: 'Минивэн', image: '/images/tariffs/minivan-3d.webp' },
    { id: 'soberDriver', name: 'Трезвый водитель', image: '/images/tariffs/sober-3d.webp' },
    { id: 'delivery', name: 'Доставка', image: '/images/tariffs/delivery-3d.webp' },
];

function BookingFormContent({ defaultFromCity, defaultToCity }: { defaultFromCity?: string, defaultToCity?: string }) {
    const { currentCity } = useCity();
    const defaultGeoCity = useGeolocationCity('Ижевск');
    const [step, setStep] = useState(1);

    const searchParams = useSearchParams();
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlTariff = searchParams.get('tariff');

    // Form State
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');

    // Force page load reset (prevents aggressive browser back/forward caching of inputs)
    useEffect(() => {
        if (!urlFrom) {
            setFromCity('');
            setFromCoords(null);
        }
        if (!urlTo) {
            setToCity('');
            setToCoords(null);
        }
        setPriceCalc(null);
        setStep(1);
    }, []);

    // Coordinate state for routing
    const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
    const [toCoords, setToCoords] = useState<[number, number] | null>(null);

    // Update fromCity when geolocation resolves, but only if user hasn't typed anything yet
    useEffect(() => {
        if (defaultFromCity) {
            setFromCity(defaultFromCity);
            const matchedCity = cities.find(c => c.name.toLowerCase() === defaultFromCity.toLowerCase() || c.namePrepositional.toLowerCase() === defaultFromCity.toLowerCase());
            if (matchedCity) {
                setFromCoords([matchedCity.lat, matchedCity.lon]);
            }
        } else if (urlFrom) {
            setFromCity(urlFrom);
            // Auto-find coords for fromCity from our DB
            const matchedCity = cities.find(c => c.name.toLowerCase() === urlFrom.toLowerCase() || c.namePrepositional.toLowerCase() === urlFrom.toLowerCase());
            if (matchedCity) {
                setFromCoords([matchedCity.lat, matchedCity.lon]);
            }
        }
    }, [urlFrom, defaultFromCity]);

    // Removed duplicate currentCity/urlFrom watcher to prevent input override

    useEffect(() => {
        if (defaultToCity) {
            setToCity(defaultToCity);
            const matchedCity = cities.find(c => c.name.toLowerCase() === defaultToCity.toLowerCase() || c.namePrepositional.toLowerCase() === defaultToCity.toLowerCase());
            if (matchedCity) {
                setToCoords([matchedCity.lat, matchedCity.lon]);
            }
        } else if (urlTo) {
            setToCity(urlTo);
            const matchedCity = cities.find(c => c.name.toLowerCase() === urlTo.toLowerCase() || c.namePrepositional.toLowerCase() === urlTo.toLowerCase());
            if (matchedCity) {
                setToCoords([matchedCity.lat, matchedCity.lon]);
            }
        }
    }, [urlTo, defaultToCity]);

    const { selectedTariff, setSelectedTariff } = useCity();
    const tariff = selectedTariff;
    const setTariff = setSelectedTariff;

    useEffect(() => {
        if (urlTariff && setTariff) {
            setTariff(urlTariff);
        }

        // Once any URL parameters are successfully hydrated, wipe them from the address bar
        // This prevents the page from aggressively re-hydrating stale routes on manual refresh
        if (urlFrom || urlTo || urlTariff) {
            setTimeout(() => {
                window.history.replaceState(null, '', window.location.pathname);
            }, 500); // Slight delay ensures Next Router has finished its initial push state
        }
    }, [urlTariff, setTariff, urlFrom, urlTo]);

    // Checkpoint State
    const [checkpointId, setCheckpointId] = useState<string>('');
    const activeCheckpoint = checkpoints.find(cp => cp.id === checkpointId);

    // Route Calculation State
    const [priceCalc, setPriceCalc] = useState<{ roadKm: number; minPrice: number; duration: string; tariffName: string; rawDistances: number[]; legPrices?: number[] } | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

    const handleRouteCalculated = useCallback((distancesKm: number[], durationsSeconds: number[]) => {
        let totalKm = 0;
        let totalSec = 0;

        distancesKm.forEach(d => totalKm += d);
        durationsSeconds.forEach(d => totalSec += d);

        const roadKm = Math.round(totalKm);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.round((totalSec % 3600) / 60);
        const duration = hours === 0 ? `${mins} мин` : mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;

        const selectedTariff = TARIFFS.find(t => t.id === tariff);

        // Rate 1 (From)
        const fromCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
        const rate1 = tariff === 'delivery' ? (fromCityTariffs['econom'] || 25) : (fromCityTariffs[tariff as keyof CityTariffs] || 25);

        // Rate 2 (To) - attempt to find destination city in tariffs
        let toCityMatchedName = 'Москва';
        for (const cityName of Object.keys(cityTariffs)) {
            if (toCity.toLowerCase().includes(cityName.toLowerCase())) {
                toCityMatchedName = cityName;
                break;
            }
        }
        const toCityTariffs = cityTariffs[toCityMatchedName] || cityTariffs['Москва'];
        const rate2 = tariff === 'delivery' ? (toCityTariffs['econom'] || 25) : (toCityTariffs[tariff as keyof CityTariffs] || 25);

        const baseFee = tariff === 'delivery' ? 1500 : 0;

        let minPrice = 0;
        let legPrices: number[] = [];

        if (tariff === 'delivery') {
            minPrice = 1500;
            legPrices = [1500];
        } else {
            if (distancesKm.length === 1) {
                minPrice = Math.round((baseFee + roadKm * rate1) / 100) * 100;
                legPrices = [minPrice];
            } else if (distancesKm.length === 2) {
                const rd1 = Math.round(distancesKm[0]);
                const rd2 = Math.round(distancesKm[1]);
                const price1 = Math.round((baseFee + rd1 * rate1) / 100) * 100;
                const price2 = Math.round((rd2 * rate2) / 100) * 100;
                minPrice = price1 + price2;
                legPrices = [price1, price2];
            }
        }

        setPriceCalc({ roadKm, minPrice, duration, tariffName: selectedTariff?.name || '', rawDistances: distancesKm, legPrices });
        setIsCalculatingRoute(false);
    }, [tariff, currentCity, toCity]);

    // Update price if tariff changes while coords exist
    useEffect(() => {
        if (fromCoords && toCoords && priceCalc) {
            const selectedTariff = TARIFFS.find(t => t.id === tariff);

            const fromCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
            const rate1 = tariff === 'delivery' ? (fromCityTariffs['econom'] || 25) : (fromCityTariffs[tariff as keyof CityTariffs] || 25);

            let toCityMatchedName = 'Москва';
            for (const cityName of Object.keys(cityTariffs)) {
                if (toCity.toLowerCase().includes(cityName.toLowerCase())) {
                    toCityMatchedName = cityName;
                    break;
                }
            }
            const toCityTariffs = cityTariffs[toCityMatchedName] || cityTariffs['Москва'];
            const rate2 = tariff === 'delivery' ? (toCityTariffs['econom'] || 25) : (toCityTariffs[tariff as keyof CityTariffs] || 25);

            const baseFee = tariff === 'delivery' ? 1500 : 0;

            let minPrice = 0;
            let legPrices: number[] = [];

            if (tariff === 'delivery') {
                minPrice = 1500;
                legPrices = [1500];
            } else {
                if (priceCalc.rawDistances.length === 1) {
                    minPrice = Math.round((baseFee + priceCalc.roadKm * rate1) / 100) * 100;
                    legPrices = [minPrice];
                } else if (priceCalc.rawDistances.length === 2) {
                    const rd1 = Math.round(priceCalc.rawDistances[0]);
                    const rd2 = Math.round(priceCalc.rawDistances[1]);
                    const price1 = Math.round((baseFee + rd1 * rate1) / 100) * 100;
                    const price2 = Math.round((rd2 * rate2) / 100) * 100;
                    minPrice = price1 + price2;
                    legPrices = [price1, price2];
                }
            }

            setTimeout(() => setPriceCalc(prev => prev ? { ...prev, minPrice, tariffName: selectedTariff?.name || '', legPrices } : null), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tariff, currentCity, toCity]);

    // Clear price if coords missing or checkpoint changes
    useEffect(() => {
        if (!fromCoords || !toCoords) {
            setTimeout(() => setPriceCalc(null), 0);
        } else {
            setTimeout(() => setIsCalculatingRoute(true), 0);
        }
    }, [fromCoords, toCoords, checkpointId]);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || (!phone && !comments)) {
            alert('Пожалуйста, укажите имя и телефон для связи.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromCity,
                    toCity,
                    tariff,
                    passengers,
                    customerName: name,
                    customerPhone: phone,
                    comments: comments,
                    dateTime: `${date || ''} ${time || ''}`.trim(),
                    priceEstimate: priceCalc?.minPrice || null,
                    checkpointName: activeCheckpoint ? activeCheckpoint.name : null,
                    fromCoords: fromCoords ? `${fromCoords[0]},${fromCoords[1]}` : null,
                    toCoords: toCoords ? `${toCoords[0]},${toCoords[1]}` : null,
                    checkpointCoords: activeCheckpoint && activeCheckpoint.coords ? `${activeCheckpoint.coords[0]},${activeCheckpoint.coords[1]}` : null
                }),
            });

            if (res.ok) {
                setSubmitSuccess(true);
                // Scroll to the top of the form so the success message is centered/visible
                const element = document.getElementById('booking-form');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                // Trigger Yandex Metrika Goal (ensure ID matches layout)
                if (typeof window !== 'undefined' && (window as any).ym) {
                    (window as any).ym(106952983, 'reachGoal', 'order_submitted');
                }
            } else {
                alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
            }
        } catch (error) {
            console.error('Error submitting order', error);
            alert('Сетевая ошибка.');
        } finally {
            setIsSubmitting(false);
        }
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

                    {submitSuccess ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <CheckCircle2 size={64} style={{ color: 'var(--color-primary)', margin: '0 auto 20px', display: 'block' }} />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Заявка отправлена!</h3>
                            <p style={{ color: 'var(--color-text-muted)' }}>Спасибо, {name}. Мы скоро свяжемся с вами для подтверждения заказа.</p>
                            <button
                                type="button"
                                className={styles.nextBtn}
                                style={{ marginTop: '30px', margin: '30px auto 0', display: 'block', maxWidth: '300px' }}
                                onClick={() => {
                                    // Hard reload ensures all caches, contexts, and address states are fully purged
                                    window.location.href = '/';
                                }}
                            >
                                Сделать новый заказ
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <>
                                    <div className={styles.grid} style={{ position: 'relative', zIndex: 1000 }}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Откуда (Город, улица, номер дома)</label>
                                            <div className={styles.inputWrapper}>
                                                <MapPin size={18} className={styles.icon} />
                                                <LeafletSuggestInput
                                                    className={styles.input}
                                                    placeholder="г. Москва, ул. Ленина, д. 1"
                                                    value={fromCity}
                                                    onChange={(e) => {
                                                        setFromCity(e.target.value);
                                                        setFromCoords(null);
                                                        setPriceCalc(null);
                                                    }}
                                                    onSuggestSelect={(text, coords) => {
                                                        setFromCity(text);
                                                        setFromCoords(coords);
                                                    }}
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
                                                    onChange={(e) => {
                                                        setToCity(e.target.value);
                                                        setToCoords(null);
                                                        setPriceCalc(null);
                                                    }}
                                                    onSuggestSelect={(text, coords) => {
                                                        setToCity(text);
                                                        setToCoords(coords);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <p className={styles.priceHint} style={{ gridColumn: '1 / -1', marginTop: '-10px', opacity: 0.8 }}>
                                            <small>* Начните вводить точный адрес, и нажмите на подходящую подсказку из поиска.</small>
                                        </p>

                                        {(requiresCheckpoint(fromCity) || requiresCheckpoint(toCity)) && (
                                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                                <label className={styles.label}>Маршрут через КПП (Опционально)</label>
                                                <div className={styles.inputWrapper}>
                                                    <Route size={18} className={styles.icon} />
                                                    <select
                                                        className={styles.input}
                                                        style={{ appearance: 'auto', paddingRight: '16px', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                                        value={checkpointId}
                                                        onChange={(e) => setCheckpointId(e.target.value)}
                                                    >
                                                        <option value="" style={{ background: '#1c1917', color: '#fff' }}>Без КПП (Прямой маршрут)</option>
                                                        {checkpoints.map(cp => (
                                                            <option key={cp.id} value={cp.id} style={{ background: '#1c1917', color: '#fff' }}>{cp.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{
                                        marginTop: '20px',
                                        borderRadius: '16px',
                                        height: '320px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                        border: '1px solid var(--glass-border)',
                                        width: '100%',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <LeafletMapPreview
                                            fromCoords={fromCoords}
                                            toCoords={toCoords}
                                            checkpointCoords={activeCheckpoint ? activeCheckpoint.coords : null}
                                            onRouteCalculated={handleRouteCalculated}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Выберите тариф</label>
                                        <div className={styles.tariffGrid}>
                                            {TARIFFS.map((t) => {
                                                const fromCityTariffs = cityTariffs[currentCity?.name || 'Москва'] || cityTariffs['Москва'];
                                                const itemPrice = fromCityTariffs[t.id as keyof CityTariffs] || 25;
                                                const rate1 = t.id === 'delivery' ? (fromCityTariffs['econom'] || 25) : (fromCityTariffs[t.id as keyof CityTariffs] || 25);

                                                let toCityMatchedName = 'Москва';
                                                for (const cityName of Object.keys(cityTariffs)) {
                                                    if (toCity.toLowerCase().includes(cityName.toLowerCase())) {
                                                        toCityMatchedName = cityName;
                                                        break;
                                                    }
                                                }
                                                const toCityTariffs = cityTariffs[toCityMatchedName] || cityTariffs['Москва'];
                                                const rate2 = t.id === 'delivery' ? (toCityTariffs['econom'] || 25) : (toCityTariffs[t.id as keyof CityTariffs] || 25);

                                                let approxPrice = 0;
                                                if (priceCalc && priceCalc.rawDistances) {
                                                    if (priceCalc.rawDistances.length === 1) {
                                                        approxPrice = Math.round((priceCalc.roadKm * rate1) / 100) * 100;
                                                    } else if (priceCalc.rawDistances.length === 2) {
                                                        const p1 = Math.round((priceCalc.rawDistances[0] * rate1) / 100) * 100;
                                                        const p2 = Math.round((priceCalc.rawDistances[1] * rate2) / 100) * 100;
                                                        approxPrice = p1 + p2;
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={t.id}
                                                        className={`${styles.tariffCard} ${tariff === t.id ? styles.tariffActive : ''}`}
                                                        onClick={() => setTariff(t.id)}
                                                    >
                                                        {tariff === t.id && <CheckCircle2 size={16} className={styles.checkIcon} />}
                                                        <div className={styles.carImageWrapper}>
                                                            <img
                                                                src={t.image}
                                                                alt={t.name}
                                                                className={styles.carImage}
                                                                style={{
                                                                    '--base-scale': t.id === 'delivery' ? 1.3 : (t.id === 'soberDriver' ? 1 : 1.2),
                                                                    '--base-translate': t.id === 'delivery' ? '-8px' : (t.id === 'soberDriver' ? '0px' : '-4px'),
                                                                    '--hover-scale': t.id === 'delivery' ? 1.4 : (t.id === 'soberDriver' ? 1.1 : 1.3),
                                                                    '--hover-translate': t.id === 'delivery' ? '-12px' : (t.id === 'soberDriver' ? '-2px' : '-6px')
                                                                } as React.CSSProperties}
                                                            />
                                                        </div>
                                                        <div className={styles.tariffCardBody}>
                                                            <span className={styles.tariffName}>{t.name}</span>
                                                            <span className={styles.tariffPrice}>
                                                                {(t.id === 'delivery' || t.id === 'soberDriver') ? 'от 1500 ₽*' : `от ${itemPrice} ₽/км`}
                                                            </span>
                                                            {priceCalc && (
                                                                <div className={styles.priceEstimate}>
                                                                    <div className={styles.priceLabel}>Примерная стоимость</div>
                                                                    <div className={styles.priceValue}>
                                                                        {(t.id === 'delivery' || t.id === 'soberDriver') ? 'от 1500 ₽' : `~ ${approxPrice.toLocaleString('ru-RU')} ₽`}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                                    {(tariff !== 'delivery' && tariff !== 'soberDriver') && (
                                                        <div className={styles.priceStat}>
                                                            <Ruler size={15} className={styles.priceStatIcon} />
                                                            <span>{priceCalc.roadKm} км</span>
                                                        </div>
                                                    )}
                                                    <div className={styles.priceStat}>
                                                        <Clock3 size={15} className={styles.priceStatIcon} />
                                                        <span>~{priceCalc.duration}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.priceResultTotal}>
                                                    от <strong>{(tariff === 'delivery' || tariff === 'soberDriver') ? '1 500' : priceCalc.minPrice.toLocaleString('ru-RU')} ₽</strong>
                                                </div>

                                                {(tariff !== 'delivery' && tariff !== 'soberDriver') && (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        fontSize: '0.90rem',
                                                        color: '#fff',
                                                        background: 'rgba(212, 175, 55, 0.1)',
                                                        border: '1px solid rgba(212, 175, 55, 0.2)',
                                                        borderRadius: '8px',
                                                        padding: '12px 16px',
                                                        marginBottom: '20px',
                                                        marginTop: '10px',
                                                        fontWeight: 400
                                                    }}>
                                                        * Платные участки дороги оплачиваются отдельно
                                                    </div>
                                                )}
                                                {(tariff === 'delivery' || tariff === 'soberDriver') && (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        fontSize: '0.95rem',
                                                        color: '#fff',
                                                        background: 'rgba(212, 175, 55, 0.15)',
                                                        border: '1px solid rgba(212, 175, 55, 0.3)',
                                                        borderRadius: '8px',
                                                        padding: '12px 16px',
                                                        marginBottom: '20px',
                                                        marginTop: '-5px',
                                                        fontWeight: 500
                                                    }}>
                                                        * Для уточнения окончательной стоимости {tariff === 'delivery' ? 'доставки' : 'услуги'} обратитесь к диспетчеру
                                                    </div>
                                                )}
                                                {(tariff !== 'delivery' && tariff !== 'soberDriver' && priceCalc.legPrices && priceCalc.legPrices.length === 2) && (
                                                    <div className={styles.receiptBox}>
                                                        <div className={styles.receiptTitle} style={{ color: 'var(--color-primary)' }}>Детализация стоимости</div>
                                                        <div className={styles.receiptRow}>
                                                            <span>До границы ({activeCheckpoint?.name?.replace('КПП ', '') || 'КПП'})</span>
                                                            <span>{(priceCalc.legPrices[0]).toLocaleString('ru-RU')} ₽</span>
                                                        </div>
                                                        <div className={styles.receiptRow}>
                                                            <span>После границы</span>
                                                            <span>{priceCalc.legPrices[1].toLocaleString('ru-RU')} ₽</span>
                                                        </div>
                                                    </div>
                                                )}
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
                                        <button
                                            type="button"
                                            className={styles.nextBtn}
                                            onClick={() => {
                                                setStep(2);
                                                // Wait for render, then scroll to the top of the form
                                                setTimeout(() => {
                                                    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }, 50);
                                            }}
                                        >
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

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Дополнительная информация (комментарий)</label>
                                                <div className={styles.inputWrapper}>
                                                    <MessageSquare size={18} className={styles.icon} style={{ alignSelf: 'flex-start', marginTop: '12px' }} />
                                                    <textarea
                                                        className={styles.input}
                                                        placeholder="Детское кресло, много багажа, рейс СУ-1234..."
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        rows={3}
                                                        style={{ height: 'auto', paddingTop: '12px', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Количество пассажиров: {passengers}</label>
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setPassengers(num)}
                                                            style={{
                                                                flex: 1,
                                                                height: '48px',
                                                                borderRadius: '12px',
                                                                background: passengers === num ? 'var(--color-primary)' : 'var(--glass-bg)',
                                                                color: passengers === num ? '#fff' : 'var(--color-foreground)',
                                                                border: `1px solid ${passengers === num ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                fontWeight: passengers === num ? 'bold' : 'normal',
                                                            }}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className={styles.priceHint} style={{ marginTop: '10px' }}>
                                                    <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                                    Для компаний больше 4 человек рекомендуем выбрать класс Минивэн
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
                                            <button type="button" className={styles.backBtn} onClick={() => setStep(1)} disabled={isSubmitting}>
                                                <ChevronLeft size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> Назад
                                            </button>
                                            <button type="submit" className={styles.nextBtn} disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 size={24} style={{ animation: 'spin 2s linear infinite', margin: '0 auto' }} /> : 'Заказать Трансфер'}
                                            </button>
                                        </div>
                                    </>
                                )
                            }
                        </form >
                    )}
                </div >
            </div >
        </section >
    );
}

export default function BookingForm({ defaultFromCity, defaultToCity }: { defaultFromCity?: string, defaultToCity?: string }) {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} />
            </div>
        }>
            <BookingFormContent defaultFromCity={defaultFromCity} defaultToCity={defaultToCity} />
        </Suspense>
    );
}
