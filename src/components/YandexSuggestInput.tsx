"use client";

import { useEffect, useRef, useState, InputHTMLAttributes } from 'react';
import { useYMaps } from '@pbe/react-yandex-maps';

interface YandexSuggestInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onSuggestSelect: (text: string, coords: [number, number]) => void;
    cityBounds?: number[][] | null;
    ymaps: any;
}

export default function YandexSuggestInput({ onSuggestSelect, cityBounds, ymaps, ...props }: YandexSuggestInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestViewRef = useRef<any>(null);

    useEffect(() => {
        console.log("YandexSuggestInput -> ymaps loaded:", !!ymaps, "inputRef:", !!inputRef.current);
        if (!ymaps || !inputRef.current) return;

        // Cleanup previous instance if any
        if (suggestViewRef.current) {
            suggestViewRef.current.destroy();
        }

        const options: any = {};

        if (cityBounds) {
            options.boundedBy = cityBounds;
        }

        suggestViewRef.current = new ymaps.SuggestView(inputRef.current, options);

        suggestViewRef.current.events.add('select', (e: any) => {
            const item = e.get('item');
            const address = item.value;

            // Call change handler to update visible value
            if (props.onChange) {
                const event = { target: { value: address } } as any;
                props.onChange(event);
            }

            // Geocode the selected address to get coordinates
            ymaps.geocode(address).then((result: any) => {
                const firstGeoObject = result.geoObjects.get(0);
                if (firstGeoObject) {
                    const coords = firstGeoObject.geometry.getCoordinates();
                    onSuggestSelect(address, coords);
                }
            });
        });

        return () => {
            if (suggestViewRef.current) {
                suggestViewRef.current.destroy();
                suggestViewRef.current = null;
            }
        };
    }, [ymaps, cityBounds]);

    return (
        <input ref={inputRef} {...props} autoComplete="off" />
    );
}
