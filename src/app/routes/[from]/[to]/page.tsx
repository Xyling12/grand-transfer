import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cities, getDistanceFromLatLonInKm } from '@/data/cities';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WhyChooseUs from '@/components/WhyChooseUs';
import Tariffs from '@/components/Tariffs';
import PopularRoutes from '@/components/PopularRoutes';
import BookingForm from '@/components/BookingForm';
import Reviews from '@/components/Reviews';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Props = {
    params: Promise<{ from: string; to: string }>
};

function getRouteDetails(fromLat: number, fromLon: number, toLat: number, toLon: number) {
    const straightDist = getDistanceFromLatLonInKm(fromLat, fromLon, toLat, toLon);
    const roadDist = Math.round(straightDist * 1.3);

    let rate = 25;
    if (roadDist > 500) rate = 22;
    const price = Math.round((500 + roadDist * rate) / 100) * 100;

    const durationMinutes = Math.round((roadDist / 75) * 60) + 30;
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durationStr = hours > 0 ? (mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`) : `${mins} мин`;

    return { roadDist, price, durationStr };
}

export async function generateMetadata(
    props: Props
): Promise<Metadata> {
    const params = await props.params;
    const fromId = decodeURIComponent(params.from);
    const toId = decodeURIComponent(params.to);
    const fromCity = cities.find(c => c.id === fromId);
    const toCity = cities.find(c => c.id === toId);

    if (!fromCity || !toCity) {
        return { title: 'Маршрут не найден | GrandTransfer' }
    }

    const { roadDist, price } = getRouteDetails(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon);

    return {
        title: `Такси ${fromCity.name} - ${toCity.name} | От ${price} ₽ | Трансфер, Минивэн`,
        description: `Закажите междугороднее такси ${fromCity.name} — ${toCity.name}. Дистанция ~${roadDist} км. Фиксированная цена от ${price} руб. Поездки с детьми, животными, комфортные минивэны и микроавтобусы.`,
        keywords: `такси ${fromCity.name} ${toCity.name}, трансфер ${fromCity.name} ${toCity.name}, междугороднее такси ${fromCity.name} ${toCity.name}, минивэн ${fromCity.name} ${toCity.name}, с детьми, с животными, цена`
    };
}

export default async function RoutePage(props: Props) {
    const params = await props.params;

    const fromId = decodeURIComponent(params.from);
    const toId = decodeURIComponent(params.to);
    const fromCity = cities.find(c => c.id === fromId);
    const toCity = cities.find(c => c.id === toId);

    if (!fromCity || !toCity) {
        notFound();
    }

    const { roadDist, price, durationStr } = getRouteDetails(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon);

    // Schema.org FAQ
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `Сколько стоит такси из ${fromCity.namePrepositional} в ${toCity.name}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Стоимость индивидуального трансфера по маршруту ${fromCity.name} — ${toCity.name} начинается от ${price} рублей. Цена фиксируется при заказе и не меняется в пути.`
                }
            },
            {
                "@type": "Question",
                "name": `Как долго ехать от ${fromCity.namePrepositional} до ${toCity.name}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Ориентировочное время в пути составляет ${durationStr} в зависимости от дорожных и погодных условий. Расстояние по трассе — около ${roadDist} км.`
                }
            },
            {
                "@type": "Question",
                "name": "Можно ли заказать минивэн для поездки с детьми или объемным багажом?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Да, в нашем автопарке помимо классов Эконом и Комфорт есть вместительные минивэны. Мы также бесплатно предоставляем детские кресла по предварительному запросу."
                }
            }
        ]
    };

    // Schema.org Service / Offer
    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `Междугороднее такси ${fromCity.name} — ${toCity.name}`,
        "provider": {
            "@type": "LocalBusiness",
            "name": "GrandTransfer"
        },
        "areaServed": [
            { "@type": "City", "name": fromCity.name },
            { "@type": "City", "name": toCity.name }
        ],
        "offers": {
            "@type": "Offer",
            "priceCurrency": "RUB",
            "price": price,
            "availability": "https://schema.org/InStock",
            "url": `https://xn--c1adbj4b9a7c.com/routes/${fromCity.id}/${toCity.id}`
        }
    };

    // Schema.org Breadcrumbs
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Главная",
                "item": "https://xn--c1adbj4b9a7c.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": `Такси из ${fromCity.namePrepositional}`,
                "item": `https://xn--c1adbj4b9a7c.com/#booking-form`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": `${toCity.name}`
            }
        ]
    };

    return (
        <main>
            <div id="top" />

            {/* Schema JSON-LD Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: '-15%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    bottom: '-10%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            <Header />
            <Hero defaultToCity={toCity.name} />

            {/* Breadcrumbs UI */}
            <div className="container" style={{ paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Главная</Link>
                <ChevronRight size={14} />
                <span>Направления</span>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--color-foreground)' }}>Из {fromCity.namePrepositional} в {toCity.name}</span>
            </div>

            {/* Dynamic SEO Text Block */}
            <section className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-bodoni)', color: 'var(--color-primary)' }}>
                    Индивидуальный трансфер {fromCity.name} — {toCity.name}
                </h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Расстояние по трассе</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>~{roadDist} км</span>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Время в пути</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{durationStr}</span>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Цена от</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>{price} ₽</span>
                    </div>
                </div>

                <p style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Планируете поездку из <strong>{fromCity.namePrepositional}</strong> в <strong>{toCity.name}</strong>?
                    Сервис междугородних перевозок GrandTransfer предоставляет надежные автомобили классов Комфорт, Бизнес и вместительные Минивэны для больших компаний.
                    Вам не придется искать попутчиков или ехать с пересадками на автобусах. Мы заберем вас прямо от подъезда дома или терминала аэропорта и доставим до конечного пункта с максимальным комфортом. Опытные водители, фиксированная стоимость без скрытых доплат и выдача чеков для отчетности.
                </p>
            </section>

            <WhyChooseUs />
            <Tariffs />
            <PopularRoutes />

            {/* FAQ Section specifically for this route */}
            <section className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', fontFamily: 'var(--font-bodoni)' }}>Частые вопросы по маршруту</h2>

                <div style={{ marginBottom: '1.5rem', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--color-primary)' }}>Сколько стоит такси {fromCity.name} - {toCity.name}?</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Цена за машину целиком (индивидуальный трансфер) начинается от {price} рублей за класс «Эконом». Точную стоимость для бизнеса и минивэна вы можете рассчитать в калькуляторе выше. Цена строго фиксируется при бронировании.</p>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--color-primary)' }}>Сколько времени займет дорога?</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>По трассе расстояние составляет около {roadDist} км. Ориентировочное время в пути без учета больших пробок и длительных остановок — {durationStr}.</p>
                </div>

                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--color-primary)' }}>Предоставляете ли вы детские кресла?</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Да, мы абсолютно бесплатно укомплектуем автомобиль нужным количеством детских кресел или бустеров. Просто укажите возраст детей при оформлении заявки нашему диспетчеру.</p>
                </div>
            </section>

            {/* Passing default props to pre-fill the form */}
            <BookingForm defaultFromCity={fromCity.name} defaultToCity={toCity.name} />
            <Reviews />
            <Footer />
        </main>
    );
}
