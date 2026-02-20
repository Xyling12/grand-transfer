"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        // Only run on client after hydration
        const savedCityId = localStorage.getItem('grand_transfer_city_id');

        if (savedCityId) {
            const found = cities.find(c => c.id === savedCityId);
            if (found) {
                setCurrentCity(found);
                return; // Prioritize localStorage over geolocation
            }
        }

        // Try to detect city via IP Geolocation if not set in localStorage
        const fetchCityByIP = async () => {
            try {
                const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await res.json();
                if (data && data.latitude && data.longitude) {
                    const closest = getClosestCity(parseFloat(data.latitude), parseFloat(data.longitude));
                    if (closest) {
                        console.log(`📍 IP Geolocation detected: ${closest.name}`);
                        setCurrentCity(closest);
                        localStorage.setItem('grand_transfer_city_id', closest.id);
                    }
                }
            } catch (e) {
                console.error("Error finding closest city via IP:", e);
            }
        };

        fetchCityByIP();
    }, []);

    const handleSetCity = (city: City) => {
        setCurrentCity(city);
        localStorage.setItem('grand_transfer_city_id', city.id);
    };

    return (
        <CityContext.Provider value={{
            currentCity,
            setCity: handleSetCity,
            cityList: cities,
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
