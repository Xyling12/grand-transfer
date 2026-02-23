"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapPreviewProps {
    fromCoords: [number, number] | null;
    toCoords: [number, number] | null;
    checkpointCoords?: [number, number] | null;
    onRouteCalculated: (distancesKm: number[], durationsSeconds: number[]) => void;
}

// Inner component to handle zoom/pan and routing updates
function RoutingOverlay({ fromCoords, toCoords, checkpointCoords, onRouteCalculated }: LeafletMapPreviewProps) {
    const map = useMap();
    const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

    useEffect(() => {
        if (!fromCoords && !toCoords) {
            setTimeout(() => setRouteGeometry([]), 0);
            return;
        }

        // Just focus on from point if only from is provided
        if (fromCoords && !toCoords) {
            setTimeout(() => setRouteGeometry([]), 0);
            map.flyTo(fromCoords, 13);
            return;
        }

        // Just focus on to point if only to is provided
        if (!fromCoords && toCoords) {
            setTimeout(() => setRouteGeometry([]), 0);
            map.flyTo(toCoords, 13);
            return;
        }

        // Both coordinates exist, let's fetch route
        if (fromCoords && toCoords) {
            const fetchRoute = async () => {
                try {
                    // OSRM expects coordinates as lon,lat
                    let coordsString = `${fromCoords[1]},${fromCoords[0]}`;
                    if (checkpointCoords) {
                        coordsString += `;${checkpointCoords[1]},${checkpointCoords[0]}`;
                    }
                    coordsString += `;${toCoords[1]},${toCoords[0]}`;

                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

                    const res = await fetch(osrmUrl);
                    const data = await res.json();

                    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                        const route = data.routes[0];

                        // Extract distances (meters) and durations (seconds) for each leg
                        const distances = route.legs.map((leg: { distance: number }) => leg.distance / 1000);
                        const durations = route.legs.map((leg: { duration: number }) => leg.duration);

                        onRouteCalculated(distances, durations);

                        // OSRM returns GeoJSON coordinates as [lon, lat], Leaflet wants [lat, lon]
                        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                        setRouteGeometry(coordinates);

                        // Adjust map bounds to fit the route
                        const bounds = L.latLngBounds(fromCoords, toCoords);
                        // Enhance bounds with polyline if available
                        if (coordinates.length > 0) {
                            coordinates.forEach((c: [number, number]) => bounds.extend(c));
                        }
                        map.fitBounds(bounds, { padding: [50, 50] });
                    } else {
                        console.error('OSRM route error', data);
                        setRouteGeometry([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch OSRM route:', err);
                    setRouteGeometry([]);
                }
            };

            fetchRoute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromCoords, toCoords, checkpointCoords, map]);

    return (
        <>
            {fromCoords && <Marker position={fromCoords} />}
            {checkpointCoords && <Marker position={checkpointCoords} />}
            {toCoords && <Marker position={toCoords} />}
            {routeGeometry.length > 0 && <Polyline positions={routeGeometry} color="var(--color-primary, #3b82f6)" weight={4} opacity={0.8} />}
        </>
    );
}


export default function LeafletMapPreview({ fromCoords, toCoords, checkpointCoords, onRouteCalculated }: LeafletMapPreviewProps) {
    const center: [number, number] = fromCoords || [55.751574, 37.573856]; // Default to Moscow or fromCoords

    return (
        <MapContainer
            center={center}
            zoom={9}
            scrollWheelZoom={true}
            attributionControl={false}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RoutingOverlay
                fromCoords={fromCoords}
                toCoords={toCoords}
                checkpointCoords={checkpointCoords}
                onRouteCalculated={onRouteCalculated}
            />
        </MapContainer>
    );
}
