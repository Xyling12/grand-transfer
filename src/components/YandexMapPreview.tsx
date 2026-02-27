"use client";

import { useEffect, useRef, useState } from 'react';
import { loadYmaps } from './YandexSuggestInput';

interface YandexMapPreviewProps {
    fromCoords: [number, number] | null;
    toCoords: [number, number] | null;
    checkpointCoords?: [number, number] | null;
    onRouteCalculated: (distancesKm: number[], durationsSeconds: number[]) => void;
}

// Haversine — расстояние по прямой в км
function haversineKm(a: [number, number], b: [number, number]): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 80;

/**
 * Пытаемся построить маршрут через multiRoute.model и извлечь расстояние/время.
 * Возвращает Promise<{distKm, durSec}> или rejects если не получилось.
 */
function routeSegment(
    ymaps: any,
    map: any,
    points: [number, number][],
    drawOnMap: boolean,
    routeColor: string = '#FFD700',
): Promise<{ distKm: number; durSec: number; geoObject?: any }> {
    return new Promise((resolve, reject) => {
        const multiRoute = new ymaps.multiRouter.MultiRoute({
            referencePoints: points,
            params: { routingMode: 'auto', results: 1 }
        }, {
            boundsAutoApply: false,
            routeActiveStrokeColor: routeColor,
            routeActiveStrokeWidth: 6,
            routeActiveStrokeStyle: 'solid',
            routeStrokeColor: '#d4af37',
            routeStrokeWidth: 3,
            wayPointStartIconColor: '#d4af37',
            wayPointFinishIconColor: '#d4af37',
            viaPointIconRadius: 8,
            viaPointActiveIconFillColor: '#d4af37',
            pinIconFillColor: '#d4af37',
        });

        // Добавляем на карту — нужно для загрузки данных маршрута
        map.geoObjects.add(multiRoute);

        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                reject(new Error('timeout'));
            }
        }, 8000);

        const tryExtract = () => {
            if (resolved) return;
            try {
                const modelRoutes = multiRoute.model.getRoutes();
                if (modelRoutes && modelRoutes.length > 0) {
                    const route = modelRoutes[0];
                    const paths = route.getPaths();
                    if (paths && paths.length > 0) {
                        let totalDist = 0;
                        let totalDur = 0;
                        for (let i = 0; i < paths.length; i++) {
                            const p = paths[i];
                            const props = p.properties;
                            const dist = props?.distance?.value || props?.get?.('distance')?.value;
                            const dur = props?.duration?.value || props?.get?.('duration')?.value;
                            totalDist += (dist || 0);
                            totalDur += (dur || 0);
                        }
                        if (totalDist > 0) {
                            resolved = true;
                            clearTimeout(timeout);
                            clearInterval(poll);
                            resolve({ distKm: totalDist / 1000, durSec: totalDur, geoObject: multiRoute });
                        }
                    }
                }
            } catch { }
        };

        multiRoute.model.events.add('requestsuccess', () => {
            tryExtract();
            setTimeout(tryExtract, 300);
            setTimeout(tryExtract, 800);
            setTimeout(tryExtract, 1500);
        });
        multiRoute.events.add('activeroutechange', tryExtract);
        multiRoute.events.add('update', tryExtract);

        const poll = setInterval(() => {
            if (resolved) { clearInterval(poll); return; }
            tryExtract();
        }, 400);

        // Cleanup poll on timeout
        setTimeout(() => clearInterval(poll), 8500);
    });
}

export default function YandexMapPreview({ fromCoords, toCoords, checkpointCoords, onRouteCalculated }: YandexMapPreviewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const geoObjectsRef = useRef<any[]>([]);
    const [isReady, setIsReady] = useState(false);
    const onRouteCalculatedRef = useRef(onRouteCalculated);
    onRouteCalculatedRef.current = onRouteCalculated;
    const abortRef = useRef(0);

    // Инициализация карты
    useEffect(() => {
        let cancelled = false;
        loadYmaps().then((ymaps) => {
            if (cancelled || !mapContainerRef.current || mapInstanceRef.current) {
                if (mapInstanceRef.current) setIsReady(true);
                return;
            }
            const center = fromCoords || [56.852593, 53.211463];
            const map = new ymaps.Map(mapContainerRef.current, {
                center, zoom: 9, controls: ['zoomControl'],
            }, { suppressMapOpenBlock: true });
            mapInstanceRef.current = map;
            setIsReady(true);
        }).catch(console.error);
        return () => { cancelled = true; };
    }, []);

    // Обновление маршрута
    useEffect(() => {
        if (!isReady || !mapInstanceRef.current) return;

        const ymaps = (window as any).ymaps;
        const map = mapInstanceRef.current;
        const currentAbort = ++abortRef.current;

        // Полная очистка всех объектов на карте
        map.geoObjects.removeAll();
        geoObjectsRef.current = [];

        if (!fromCoords && !toCoords) return;

        // Одна точка
        if (fromCoords && !toCoords) {
            map.setCenter(fromCoords, 13, { duration: 300 });
            const p = new ymaps.Placemark(fromCoords, {}, { preset: 'islands#darkOrangeCircleDotIcon' });
            map.geoObjects.add(p);
            geoObjectsRef.current.push(p);
            return;
        }
        if (!fromCoords && toCoords) {
            map.setCenter(toCoords, 13, { duration: 300 });
            const p = new ymaps.Placemark(toCoords, {}, { preset: 'islands#darkOrangeCircleDotIcon' });
            map.geoObjects.add(p);
            geoObjectsRef.current.push(p);
            return;
        }

        if (!fromCoords || !toCoords) return;

        // === Маршрут ===
        const buildRoute = async () => {
            const distancesKm: number[] = [];
            const durationsSeconds: number[] = [];

            if (checkpointCoords) {
                // ---- МАРШРУТ ЧЕРЕЗ КПП: два отдельных сегмента ----
                // Сегмент 1: Откуда → КПП
                let seg1Dist: number, seg1Dur: number;
                try {
                    const seg1 = await routeSegment(ymaps, map, [fromCoords, checkpointCoords], true);
                    if (currentAbort !== abortRef.current) return;
                    seg1Dist = seg1.distKm;
                    seg1Dur = seg1.durSec;
                    if (seg1.geoObject) geoObjectsRef.current.push(seg1.geoObject);
                } catch {
                    // Fallback по прямой
                    seg1Dist = haversineKm(fromCoords, checkpointCoords) * ROAD_FACTOR;
                    seg1Dur = (seg1Dist / AVG_SPEED_KMH) * 3600;
                    // Рисуем пунктирную линию
                    const line = new ymaps.Polyline([fromCoords, checkpointCoords], {}, {
                        strokeColor: '#FFD700', strokeWidth: 4, strokeStyle: 'shortdash',
                    });
                    map.geoObjects.add(line);
                    geoObjectsRef.current.push(line);
                }
                if (currentAbort !== abortRef.current) return;

                // Сегмент 2: КПП → Куда
                let seg2Dist: number, seg2Dur: number;
                try {
                    const seg2 = await routeSegment(ymaps, map, [checkpointCoords, toCoords], true);
                    if (currentAbort !== abortRef.current) return;
                    seg2Dist = seg2.distKm;
                    seg2Dur = seg2.durSec;
                    if (seg2.geoObject) geoObjectsRef.current.push(seg2.geoObject);
                } catch {
                    // Fallback по прямой
                    seg2Dist = haversineKm(checkpointCoords, toCoords) * ROAD_FACTOR;
                    seg2Dur = (seg2Dist / AVG_SPEED_KMH) * 3600;
                    const line = new ymaps.Polyline([checkpointCoords, toCoords], {}, {
                        strokeColor: '#FFD700', strokeWidth: 4, strokeStyle: 'shortdash',
                    });
                    map.geoObjects.add(line);
                    geoObjectsRef.current.push(line);
                }
                if (currentAbort !== abortRef.current) return;

                distancesKm.push(seg1Dist, seg2Dist);
                durationsSeconds.push(seg1Dur, seg2Dur);

                // Подгоняем вид карты
                try {
                    const bounds = map.geoObjects.getBounds();
                    if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
                } catch { }

            } else {
                // ---- МАРШРУТ БЕЗ КПП: один сегмент ----
                try {
                    const seg = await routeSegment(ymaps, map, [fromCoords, toCoords], true);
                    if (currentAbort !== abortRef.current) return;
                    distancesKm.push(seg.distKm);
                    durationsSeconds.push(seg.durSec);
                    if (seg.geoObject) geoObjectsRef.current.push(seg.geoObject);
                } catch {
                    // Fallback
                    const dist = haversineKm(fromCoords, toCoords) * ROAD_FACTOR;
                    const dur = (dist / AVG_SPEED_KMH) * 3600;
                    distancesKm.push(dist);
                    durationsSeconds.push(dur);
                    const line = new ymaps.Polyline([fromCoords, toCoords], {}, {
                        strokeColor: '#FFD700', strokeWidth: 4, strokeStyle: 'shortdash',
                    });
                    map.geoObjects.add(line);
                    geoObjectsRef.current.push(line);
                }
            }

            if (currentAbort !== abortRef.current) return;
            onRouteCalculatedRef.current(distancesKm, durationsSeconds);
        };

        buildRoute();

        // Cleanup при смене КПП/координат
        return () => {
            abortRef.current++;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.geoObjects.removeAll();
            }
            geoObjectsRef.current = [];
        };
    }, [fromCoords, toCoords, checkpointCoords, isReady]);

    useEffect(() => {
        return () => {
            abortRef.current++;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}
        />
    );
}
