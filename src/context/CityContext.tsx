"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cities, City, getClosestCity } from '@/data/cities';

interface CityContextType {
    currentCity: City;
    setCity: (city: City) => void;
    cityList: City[];
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
    // Initialize state synchronously to the default city to prevent Next.js hydration mismatch
    const [currentCity, setCurrentCity] = useState<City>(() => {
        // ALWAYS return the default on the first render (matching SSR)
        return cities.find(c => c.id === 'izhevsk') || cities[0];
    });

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

        // Try to detect city via Geolocation if not set in localStorage
        if (typeof navigator !== 'undefined' && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const closest = getClosestCity(latitude, longitude);
                        if (closest) {
                            console.log(`📍 Geolocation detected: ${closest.name}`);
                            setCurrentCity(closest);
                            localStorage.setItem('grand_transfer_city_id', closest.id);
                        }
                    } catch (e) {
                        console.error("Error finding closest city:", e);
                    }
                },
                (error) => {
                    console.log("Geolocation access denied or error:", error.message);
                    // Stay with default city (Izhevsk)
                }
            );
        }
    }, []);

    const handleSetCity = (city: City) => {
        setCurrentCity(city);
        localStorage.setItem('grand_transfer_city_id', city.id);
    };

    return (
        <CityContext.Provider value={{ currentCity, setCity: handleSetCity, cityList: cities }}>
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
