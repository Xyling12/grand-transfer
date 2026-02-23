import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cities } from '@/data/cities';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WhyChooseUs from '@/components/WhyChooseUs';
import Tariffs from '@/components/Tariffs';
import PopularRoutes from '@/components/PopularRoutes';
import BookingForm from '@/components/BookingForm';
import Reviews from '@/components/Reviews';
import Footer from '@/components/Footer';

type Props = {
    params: Promise<{ from: string; to: string }>
};

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

    const R = 6371;
    const dLat = (toCity.lat - fromCity.lat) * (Math.PI / 180);
    const dLon = (toCity.lon - fromCity.lon) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(fromCity.lat * (Math.PI / 180)) * Math.cos(toCity.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c * 1.3);

    let rate = 25;
    if (dist > 500) rate = 22;
    const price = Math.round((500 + dist * rate) / 100) * 100;

    return {
        title: `Такси ${fromCity.name} - ${toCity.name} | Цена от ${price} руб. | GrandTransfer`,
        description: `Закажите междугороднее такси по маршруту ${fromCity.name} — ${toCity.name}. Расстояние ~${dist}км. Фиксированная цена от ${price} руб., комфортные минивэны, опытные водители.`,
        keywords: `такси ${fromCity.name} ${toCity.name}, трансфер ${fromCity.name}, междугороднее такси ${fromCity.name} ${toCity.name}, цена такси ${fromCity.name} ${toCity.name}`
    };
}

export default async function RoutePage(props: Props) {
    const params = await props.params;

    const fromId = decodeURIComponent(params.from);
    const toId = decodeURIComponent(params.to);
    const fromCity = cities.find(c => c.id === fromId);
    const toCity = cities.find(c => c.id === toId);

    console.log("DEBUG PARAMS:", {
        rawFrom: params.from,
        rawTo: params.to,
        fromId,
        toId,
        foundFrom: !!fromCity,
        foundTo: !!toCity
    });

    if (!fromCity || !toCity) {
        notFound();
    }

    return (
        <main>
            <div id="top" />
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

            {/* Dynamic SEO Text Block tailored for this route to increase word-count and uniqueness */}
            <section className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>
                    Трансфер {fromCity.name} — {toCity.name}
                </h2>
                <p style={{ maxWidth: '800px', margin: '0 auto', color: '#666', lineHeight: 1.6 }}>
                    Планируете поездку из <strong>{fromCity.namePrepositional}</strong> в <strong>{toCity.name}</strong>?
                    Служба междугороднего такси GrandTransfer предлагает комфортные и безопасные поездки на автомобилях
                    класса Комфорт, Бизнес и Минивэн. Мы предоставляем автомобили с просторными салонами и чистыми багажниками.
                    Водитель встретит вас по указанному адресу в {fromCity.namePrepositional} и доставит точно по расписанию.
                </p>
            </section>

            <WhyChooseUs />
            <Tariffs />
            <PopularRoutes />

            {/* Passing default props to pre-fill the form */}
            <BookingForm defaultFromCity={fromCity.name} defaultToCity={toCity.name} />
            <Reviews />
            <Footer />
        </main>
    );
}
