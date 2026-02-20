"use client";

import { useEffect, useRef, useState, InputHTMLAttributes } from 'react';

interface LeafletSuggestInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onSuggestSelect: (text: string, coords: [number, number]) => void;
    cityBounds?: number[][] | null;
}

export default function LeafletSuggestInput({ onSuggestSelect, cityBounds, className, ...props }: LeafletSuggestInputProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState(props.value as string || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setQuery(props.value as string || '');
    }, [props.value]);

    useEffect(() => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                // To respect Nominatim usage policy, append something identifying.
                // But simple basic requests work fine for testing.
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
                const data = await res.json();

                if (data && Array.isArray(data)) {
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Nominatim fetch error:", err);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle clicks outside to close suggestion dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setShowSuggestions(true);
        if (props.onChange) props.onChange(e);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                {...props}
                className={className}
                value={query}
                onChange={handleChange}
                onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    margin: '4px 0 0 0',
                    padding: '8px 0',
                    listStyle: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {suggestions.map((item, idx) => (
                        <li
                            key={item.place_id || idx}
                            style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: 'var(--color-text)',
                                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--glass-border)' : 'none'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => {
                                const displayName = item.display_name;
                                const lat = parseFloat(item.lat);
                                const lon = parseFloat(item.lon);

                                setQuery(displayName);
                                setShowSuggestions(false);

                                // Leaflet uses [lat, lon] instead of [lon, lat] for coordinates or vice versa
                                // Let's strictly use [lat, lon] which is Leaflet standard 
                                onSuggestSelect(displayName, [lat, lon]);

                                if (props.onChange) {
                                    const event = { target: { value: displayName } } as any;
                                    props.onChange(event);
                                }
                            }}
                        >
                            {item.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
