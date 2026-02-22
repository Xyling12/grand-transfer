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
        const sessionCityId = sessionStorage.getItem('grand_transfer_city_id');

        if (sessionCityId) {
            const found = cities.find(c => c.id === sessionCityId);
            if (found) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCurrentCity(found);
                return; // Use session storage if they already picked one this session
            }
        }

        // Try to detect city via IP Geolocation if not set in sessionStorage
        const fetchCityByIP = async () => {
            try {
                const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await res.json();
                if (data && data.latitude && data.longitude) {
                    const closest = getClosestCity(parseFloat(data.latitude), parseFloat(data.longitude));
                    if (closest) {
                        console.log(`📍 IP Geolocation detected: ${closest.name}`);
                        setCurrentCity(closest);
                        sessionStorage.setItem('grand_transfer_city_id', closest.id);
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
        sessionStorage.setItem('grand_transfer_city_id', city.id);
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
