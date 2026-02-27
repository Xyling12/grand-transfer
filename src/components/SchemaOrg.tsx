import React from 'react';

const SITE_URL = 'https://xn--c1acbe2apap.com';

export default function SchemaOrg() {
    const transportSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TransportationService",
                "@id": `${SITE_URL}/#organization`,
                "name": "GrandTransfer",
                "alternateName": "Такси Межгород",
                "description": "Межгородское такси и трансфер по всей России и СНГ. Фиксированные цены, комфортные автомобили, опытные водители.",
                "url": SITE_URL,
                "telephone": "+79501587878",
                "email": "romanbatkovic1@yandex.ru",
                "priceRange": "₽₽",
                "areaServed": {
                    "@type": "Country",
                    "name": "Russia"
                },
                "founder": {
                    "@type": "Person",
                    "name": "Панкратов Роман Борисович",
                    "jobTitle": "Основатель"
                },
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                },
                "sameAs": [
                    "https://vk.ru/ru.transfer",
                    "https://t.me/Rom474",
                    "https://wa.me/79501587878"
                ]
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "url": SITE_URL,
                "name": "GrandTransfer — Такси Межгород",
                "publisher": { "@id": `${SITE_URL}/#organization` },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${SITE_URL}/routes?q={search_term_string}`
                    },
                    "query-input": "required name=search_term_string"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(transportSchema) }}
        />
    );
}
