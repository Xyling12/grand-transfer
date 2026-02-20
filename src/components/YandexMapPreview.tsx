"use client";

import { useEffect, useRef } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';

interface YandexMapPreviewProps {
    fromCoords: [number, number] | null;
    toCoords: [number, number] | null;
    onRouteCalculated: (distanceKm: number, durationSeconds: number) => void;
    onLoadInstance?: (ymaps: any) => void;
}

export default function YandexMapPreview({ fromCoords, toCoords, onRouteCalculated, onLoadInstance }: YandexMapPreviewProps) {
    const mapRef = useRef<any>(null);
    const ymapsRef = useRef<any>(null);
    const routeRef = useRef<any>(null);

    const handleLoad = (ymaps: any) => {
        ymapsRef.current = ymaps;
        if (onLoadInstance) {
            onLoadInstance(ymaps);
        }
        calculateRoute();
    };

    const calculateRoute = () => {
        if (!ymapsRef.current || !mapRef.current || !fromCoords || !toCoords) {
            if (routeRef.current && mapRef.current) {
                mapRef.current.geoObjects.remove(routeRef.current);
                routeRef.current = null;
            }
            return;
        }

        const ymaps = ymapsRef.current;

        if (routeRef.current) {
            mapRef.current.geoObjects.remove(routeRef.current);
        }

        const multiRoute = new ymaps.multiRouter.MultiRoute(
            {
                referencePoints: [fromCoords, toCoords],
                params: {
                    routingMode: 'auto'
                }
            },
            {
                boundsAutoApply: true,
                wayPointVisible: true
            }
        );

        routeRef.current = multiRoute;
        mapRef.current.geoObjects.add(multiRoute);

        multiRoute.model.events.add('requestsuccess', function () {
            const activeRoute = multiRoute.getActiveRoute();
            if (activeRoute) {
                const distanceVal = activeRoute.properties.get('distance').value; // in meters
                const durationVal = activeRoute.properties.get('duration').value; // in seconds

                onRouteCalculated(distanceVal / 1000, durationVal);
            }
        });
    };

    useEffect(() => {
        calculateRoute();
    }, [fromCoords, toCoords]);

    return (
        <Map
            defaultState={{ center: [55.751574, 37.573856], zoom: 9, controls: ['zoomControl'] }}
            options={{ suppressMapOpenBlock: true }}
            width="100%"
            height="100%"
            instanceRef={(ref) => {
                if (ref) {
                    mapRef.current = ref;
                    // Trigger route calc if ref is set after ymaps is loaded
                    if (ymapsRef.current && fromCoords && toCoords && !routeRef.current) {
                        calculateRoute();
                    }
                }
            }}
            onLoad={handleLoad}
        />
    );
}
