import type { Metadata } from 'next';
import Link from 'next/link';
import { cities } from '@/data/cities';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: 'Все междугородние маршруты по России | GrandTransfer',
    description: 'Полный список маршрутов междугороднего такси по России. Выберите город отправления и прибытия для точного расчёта стоимости и заказа комфортного трансфера.',
};

export default function RoutesHubPage() {
    // Group routes by 'From' city to make the page somewhat navigable
    // Given 100 cities, this page will have a lot of links. That's exactly what we want for SEO (a mega-menu of routes).

    return (
        <main>
            <div id="top" />
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
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

            <Header />

            <section className="container" style={{ padding: '120px 20px 60px', position: 'relative', zIndex: 1 }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', textAlign: 'center' }}>
                    Популярные междугородние направления
                </h1>
                <p style={{ textAlign: 'center', color: '#888', marginBottom: '60px', maxWidth: '800px', margin: '0 auto 60px' }}>
                    Выберите ваш город отправления, чтобы увидеть доступные варианты трансфера.
                    Мы осуществляем перевозки по всем ключевым направлениям России с комфортом и по фиксированным ценам.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                    {cities.map((fromCity) => {
                        // Take the top 12 closest destinations to avoid rendering 10,000 links on a single DOM page
                        const destinationLinks = fromCity.popularRoutes.slice(0, 15);

                        return (
                            <div key={fromCity.id} style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px',
                                padding: '24px',
                            }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--color-primary)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                                    Из {fromCity.namePrepositional}
                                </h2>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {destinationLinks.map(route => {
                                        // Find destination ID
                                        const toCity = cities.find(c => c.name === route.to);
                                        // Skip rendering if the destination is a generic fallback (like 'Аэропорт')
                                        if (!toCity) return null;

                                        return (
                                            <li key={toCity.id}>
                                                <Link
                                                    href={`/routes/${fromCity.id}/${toCity.id}`}
                                                    prefetch={false}
                                                    style={{ color: '#ccc', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}
                                                    className="hover-link"
                                                >
                                                    <span>в {toCity.name}</span>
                                                    <span style={{ color: '#666' }}>~{route.distance} км</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                                        И другие направления...
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                .hover-link:hover { color: var(--color-primary) !important; text-decoration: underline !important; }
            `}} />
        </main>
    );
}
