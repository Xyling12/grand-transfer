"use client";

import { useEffect, useRef, useState, InputHTMLAttributes } from 'react';

interface LeafletSuggestInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onSuggestSelect: (text: string, coords: [number, number]) => void;
}

interface OsmSuggestion {
    place_id?: number;
    display_name: string;
    lat: string;
    lon: string;
}

export default function LeafletSuggestInput({ onSuggestSelect, className, ...props }: LeafletSuggestInputProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState(props.value as string || '');
    const [suggestions, setSuggestions] = useState<OsmSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [hasSelected, setHasSelected] = useState(false);

    // Sync internal query state if external value changes (e.g. from URL params)
    useEffect(() => {
        if (props.value !== undefined && props.value !== query) {
            setQuery(props.value as string);
        }
    }, [props.value]);

    useEffect(() => {
        if (!query || query.length < 1) {
            setSuggestions([]);
            return;
        }

        if (hasSelected) {
            setHasSelected(false);
            return;
        }

        setIsFetching(true);
        const timer = setTimeout(async () => {
            try {
                // Clean query to improve Nominatim matching (it struggles with incomplete prefixes like "ул ба" or "г казань")
                const cleanQuery = query.replace(/(^|\s)(ул\.?|г\.?|д\.?|пер\.?|пр-кт|просп\.?)\s+/gi, '$1').trim();

                // First attempt: standard clean query
                let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=5&accept-language=ru&countrycodes=ru,by,kz,ua`);
                let data = await res.json();

                // Second attempt: if no results and query has commas, try without commas (Nominatim is very strict about comma placement)
                if ((!data || data.length === 0) && cleanQuery.includes(',')) {
                    const commaLessQuery = cleanQuery.replace(/,/g, ' ');
                    res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(commaLessQuery)}&format=json&addressdetails=1&limit=5&accept-language=ru&countrycodes=ru,by,kz,ua`);
                    data = await res.json();
                }

                if (data && Array.isArray(data)) {
                    setSuggestions(data);
                    if (data.length > 0) setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Nominatim fetch error:", err);
            } finally {
                setIsFetching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, hasSelected]);

    // Handle clicks outside to close suggestion dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        }
    }, []);

    const handleSelect = (item: OsmSuggestion) => {
        const displayName = item.display_name;
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        setHasSelected(true);
        setQuery(displayName);
        setShowSuggestions(false);
        onSuggestSelect(displayName, [lat, lon]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (props.onChange) props.onChange(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault();
            handleSelect(suggestions[0]);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Delay to allow click on suggestion list to register first
        setTimeout(() => {
            setShowSuggestions(false);
            if (props.onBlur) props.onBlur(e);
        }, 200);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <style>{`
                @keyframes lsi-spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <input
                {...props}
                className={className}
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={(e) => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                    if (props.onFocus) props.onFocus(e);
                }}
                autoComplete="off"
            />

            {isFetching && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'lsi-spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 99999,
                    background: 'var(--color-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '8px 0',
                    listStyle: 'none',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    {suggestions.map((item, idx) => (
                        <li
                            key={item.place_id || idx}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                color: 'var(--color-foreground)',
                                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleSelect(item)}
                        >
                            <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                {item.display_name.split(',')[0]}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.display_name.split(',').slice(1).join(',').trim()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
