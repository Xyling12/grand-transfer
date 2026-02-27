"use client";
import { usePathname } from 'next/navigation'; import React, { createContext, useContext, useState, useEffect } from 'react';
import { cities, City, getClosestCity } from '@/data/cities';

interface CityContextType {
    currentCity: City;
    setCity: (city: City) => void;
    cityList: City[];
    selectedTariff: string;
    setSelectedTariff: (tariff: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
    // Initialize state synchronously to the default city to prevent Next.js hydration mismatch
    const [currentCity, setCurrentCity] = useState<City>(() => {
        return cities.find(c => c.id === 'izhevsk') || cities[0];
    });

    const [selectedTariff, setSelectedTariff] = useState<string>('standart');

    const pathname = usePathname();

    useEffect(() => {
        // Skip geolocation if we are on a specific route page
        if (pathname && pathname.startsWith('/routes/')) {
            const parts = pathname.split('/');
            if (parts.length >= 3) {
                const fromId = parts[2];
                const fromCity = cities.find(c => c.id === fromId);
                if (fromCity) {
                    setCurrentCity(fromCity);
                    return;
                }
            }
        }

        // Always try to detect city via IP Geolocation on mount
        const fetchCityByIP = async () => {
            try {
                const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await res.json();
                if (data && data.latitude && data.longitude) {
                    const closest = getClosestCity(parseFloat(data.latitude), parseFloat(data.longitude));
                    if (closest) {
                        // Город определён по IP
                        setCurrentCity(closest);
                    }
                }
            } catch (e) {
                console.error("Error finding closest city via IP:", e);
            }
        };

        fetchCityByIP();
    }, [pathname]);

    const handleSetCity = (city: City) => {
        setCurrentCity(city);
    };

    const sortedCityList = [
        currentCity,
        ...cities.filter(c => c.id !== currentCity.id)
    ];

    return (
        <CityContext.Provider value={{
            currentCity,
            setCity: handleSetCity,
            cityList: sortedCityList,
            selectedTariff,
            setSelectedTariff
        }}>
            {children}
        </CityContext.Provider>
    );
}

export function useCity() {
    const context = useContext(CityContext);
    if (context === undefined) {
        throw new Error('useCity must be used within a CityProvider');
    }
    return context;
}
