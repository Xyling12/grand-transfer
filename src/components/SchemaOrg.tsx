import React from 'react';

export default function SchemaOrg() {
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "TransportationService",
        "name": "GrandTransfer",
        "description": "Межгородское такси и трансфер, где комфорт и безопасность — не опция, а стандарт. Пассажирские перевозки между городами.",
        "url": "https://grand-transfer.ru", // Replace with actual if known
        "telephone": "+79501587878",
        "priceRange": "₽",
        "areaServed": {
            "@type": "Country",
            "name": "Russia"
        },
        "sameAs": [
            "https://vk.ru/ru.transfer",
            "https://t.me/Rom474",
            "https://wa.me/79501587878"
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
    );
}
