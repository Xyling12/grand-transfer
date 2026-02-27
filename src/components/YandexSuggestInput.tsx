"use client";

import { useEffect, useRef, useState, InputHTMLAttributes, useCallback } from 'react';

const YMAPS_API_KEY = '0f847994-da3d-48b9-8586-20f065b299d3';

interface YandexSuggestInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onSuggestSelect: (text: string, coords: [number, number]) => void;
}

interface GeoSuggestion {
    name: string;
    description: string;
    fullAddress: string;
    coords: [number, number];
}

// Глобальный загрузчик ymaps — грузится один раз
let ymapsLoadPromise: Promise<any> | null = null;
function loadYmaps(): Promise<any> {
    if (ymapsLoadPromise) return ymapsLoadPromise;

    ymapsLoadPromise = new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && (window as any).ymaps) {
            (window as any).ymaps.ready(() => resolve((window as any).ymaps));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YMAPS_API_KEY}&lang=ru_RU`;
        script.async = true;
        script.onload = () => {
            (window as any).ymaps.ready(() => resolve((window as any).ymaps));
        };
        script.onerror = () => reject(new Error('Не удалось загрузить Яндекс Карты API'));
        document.head.appendChild(script);
    });

    return ymapsLoadPromise;
}

export { loadYmaps, YMAPS_API_KEY };

export default function YandexSuggestInput({ onSuggestSelect, className, ...props }: YandexSuggestInputProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(props.value as string || '');
    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [hasSelected, setHasSelected] = useState(false);
    const [ymapsReady, setYmapsReady] = useState(false);

    // Синхронизация если value меняется снаружи
    useEffect(() => {
        if (props.value !== undefined && props.value !== query) {
            setQuery(props.value as string);
        }
    }, [props.value]);

    // Загрузка API
    useEffect(() => {
        loadYmaps().then(() => setYmapsReady(true)).catch(console.error);
    }, []);

    // Поиск через Геокодер при вводе текста
    useEffect(() => {
        if (!ymapsReady || !query || query.length < 2) {
            if (!query || query.length < 2) setSuggestions([]);
            return;
        }

        if (hasSelected) {
            setHasSelected(false);
            return;
        }

        setIsFetching(true);
        const timer = setTimeout(async () => {
            try {
                const ymaps = (window as any).ymaps;
                const result = await ymaps.geocode(query, {
                    results: 5,
                    json: false,
                });

                const items: GeoSuggestion[] = [];
                result.geoObjects.each((obj: any) => {
                    const coords = obj.geometry.getCoordinates();
                    const name = obj.properties.get('name') || '';
                    const description = obj.properties.get('description') || '';
                    const fullAddress = obj.getAddressLine() || `${name}, ${description}`;

                    items.push({ name, description, fullAddress, coords });
                });

                setSuggestions(items);
                if (items.length > 0 && document.activeElement === inputRef.current) {
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Ошибка геокодирования:", err);
            } finally {
                setIsFetching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, ymapsReady, hasSelected]);

    // Закрытие при клике снаружи
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("touchstart", handleClickOutside, true);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
        };
    }, []);

    const handleSelect = useCallback((item: GeoSuggestion) => {
        setHasSelected(true);
        setQuery(item.fullAddress);
        setShowSuggestions(false);
        onSuggestSelect(item.fullAddress, item.coords);
    }, [onSuggestSelect]);

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
        setTimeout(() => {
            setShowSuggestions(false);
            if (props.onBlur) props.onBlur(e);
        }, 200);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <style>{`
                @keyframes ysi-spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <input
                {...props}
                ref={inputRef}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'ysi-spin 1s linear infinite' }}>
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
                    margin: 0,
                }}>
                    {suggestions.map((item, idx) => (
                        <li
                            key={idx}
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
                                {item.name}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.description}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
