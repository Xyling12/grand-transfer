import { useState, useEffect } from 'react';

export function useGeolocationCity(defaultCity: string = 'Ижевск') {
    const [city, setCity] = useState<string>(defaultCity);

    useEffect(() => {
        const fetchCity = async () => {
            try {
                // Using HTTPS endpoint for secure geolocation
                const response = await fetch('https://ipapi.co/json/');

                if (!response.ok) {
                    return; // Fail silently, default fallback to Izhevsk will remain
                }

                const data = await response.json();

                if (data && data.city) {
                    setCity(data.city);
                }

                // Only override if we confidently got a Russian city back format (or any city to allow international)
                if (data && data.city) {
                    // Try to normalize some common cities or just use what the API returned 
                    // (ipapi generally returns English or local language based on region)
                    // You might need a mapping if you want strictly Russian names, 
                    // but for now we'll just throw it in the state.

                    // Simple translation attempt for major cities if returned in English
                    const rawCity = data.city;
                    const dictionary: Record<string, string> = {
                        'Izhevsk': 'Ижевск',
                        'Moscow': 'Москва',
                        'Kazan': 'Казань',
                        'Saint Petersburg': 'Санкт-Петербург',
                        'Ufa': 'Уфа',
                        'Perm': 'Пермь',
                        'Samara': 'Самара',
                        'Yekaterinburg': 'Екатеринбург'
                    };

                    setCity(dictionary[rawCity] || rawCity);
                }
            } catch {
                // Intentionally swallowing the error so it doesn't crash the Next.js dev server or client
                // console.error("Failed to fetch geolocation city", error);
            }
        };

        fetchCity();
    }, []);

    return city;
}
