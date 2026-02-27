import styles from './page.module.css';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Вопрос - Ответ (FAQ) | GrandTransfer',
    description: 'Часто задаваемые вопросы о сервисе междугородних перевозок GrandTransfer. Узнайте больше о тарифах, автопарке и условиях поездки.',
    alternates: {
        canonical: 'https://xn--c1acbe2apap.com/faq',
    },
};

const faqs = [
    {
        q: 'Как узнать стоимость поездки заранее?',
        a: 'Воспользуйтесь калькулятором на главной странице сайта. Введите город отправления, город назначения и выберите желаемый тариф. Система автоматически рассчитает точную или ориентировочную стоимость на основе расстояния.'
    },
    {
        q: 'Изменится ли цена во время поездки?',
        a: 'Нет, мы работаем по фиксированным тарифам. Стоимость, которая была озвучена диспетчером при подтверждении заказа, остается неизменной независимо от пробок на трассе или светофоров.'
    },
    {
        q: 'За какое время лучше всего оформлять заказ?',
        a: 'Мы рекомендуем бронировать автомобиль минимум за 24 часа до планируемой поездки. Это позволит нам подобрать наиболее подходящий автомобиль и гарантировать подачу точно в срок.'
    },
    {
        q: 'Меняются ли тарифы в ночное время?',
        a: 'Наша ценовая политика прозрачна. У нас нет ночных или праздничных наценок, а также коэффициентов повышенного спроса, как в обычных агрегаторах.'
    },
    {
        q: 'Предоставляете ли вы детское кресло?',
        a: 'Да, безопасность детей для нас в приоритете. Обязательно предупредите диспетчера о поездке с ребенком, укажите его возраст и вес, и мы бесплатно предоставим подходящее детское кресло.'
    },
    {
        q: 'Можно ли поехать с домашним животным (кошка, собака)?',
        a: 'Поездки с животными разрешены, однако просим обязательно предупредить об этом при оформлении заказа. Для небольших питомцев потребуется переноска, для крупных — подстилка и намордник.'
    },
    {
        q: 'Нужно ли доплачивать за нестандартный багаж?',
        a: 'Если ваш багаж помещается в багажник выбранного автомобиля (седан, универсал или минивэн), дополнительная плата не взимается. Для крупногабаритного багажа советуем заранее выбрать тариф «Минивэн».'
    },
    {
        q: 'Как я могу оплатить поездку?',
        a: 'Вы можете оплатить поездку наличными или онлайн-переводом по реквизитам непосредственно водителю после завершения поездки (или перед началом по согласованию).'
    }
];

// FAQPage JSON-LD schema for Google rich results
function FAQSchema() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
    );
}

// BreadcrumbList schema
function BreadcrumbSchema() {
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Главная",
                "item": "https://xn--c1acbe2apap.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "FAQ",
                "item": "https://xn--c1acbe2apap.com/faq"
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
    );
}

export default function FAQPage() {
    return (
        <main className={styles.main}>
            <FAQSchema />
            <BreadcrumbSchema />
            <Header />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <nav aria-label="Breadcrumb" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Главная</Link>
                    <span style={{ margin: '0 8px', color: 'var(--color-text-muted)' }}>/</span>
                    <span style={{ color: 'var(--color-primary)' }}>FAQ</span>
                </nav>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className={styles.title} style={{ textAlign: 'center' }}>Вопрос - Ответ (FAQ)</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Самые популярные вопросы о работе нашего сервиса
                    </p>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <div key={index} className={styles.faqItem}>
                            <h3 className={styles.question}>{faq.q}</h3>
                            <p className={styles.answer}>{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Link href="/" className={styles.backLink}>
                        Вернуться на главную
                    </Link>
                </div>
            </div>
            <Footer />
        </main>
    );
}
