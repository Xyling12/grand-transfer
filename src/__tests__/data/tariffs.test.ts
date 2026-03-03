/**
 * tariffs.test.ts — Tests for src/data/tariffs.ts
 * Skill applied: javascript-testing-patterns
 * Patterns: data integrity, parametrize, structure validation
 */
import { describe, it, expect } from 'vitest';
import { cityTariffs, type CityTariffs } from '@/data/tariffs';

// ─── cityTariffs data integrity ───────────────────────────────────────────────

describe('cityTariffs data integrity', () => {
    const cities = Object.keys(cityTariffs);

    it('has at least 50 cities', () => {
        expect(cities.length).toBeGreaterThanOrEqual(50);
    });

    it('every city has all 7 required tariff fields', () => {
        const requiredFields: (keyof CityTariffs)[] = [
            'econom', 'standart', 'comfort', 'comfortPlus',
            'business', 'minivan', 'soberDriver',
        ];
        for (const city of cities) {
            const tariff = cityTariffs[city];
            for (const field of requiredFields) {
                expect(
                    tariff[field],
                    `City "${city}" missing field "${field}"`
                ).toBeDefined();
                expect(
                    typeof tariff[field],
                    `City "${city}", field "${field}" should be a number`
                ).toBe('number');
                expect(
                    tariff[field],
                    `City "${city}", field "${field}" should be > 0`
                ).toBeGreaterThan(0);
            }
        }
    });

    it('base tariff order: econom ≤ standart ≤ comfort ≤ business', () => {
        for (const city of cities) {
            const t = cityTariffs[city];
            expect(t.econom).toBeLessThanOrEqual(t.standart);
            expect(t.standart).toBeLessThanOrEqual(t.comfort);
            expect(t.comfort).toBeLessThanOrEqual(t.business);
        }
    });

    it('contains key Russian cities: Москва или Ижевск', () => {
        const hasIzhevsk = 'Ижевск' in cityTariffs;
        const hasMoscow = 'Москва' in cityTariffs;
        expect(hasIzhevsk || hasMoscow).toBe(true);
    });

    it('contains Ижевск as a city', () => {
        expect(cityTariffs['Ижевск']).toBeDefined();
    });

    it('Ижевск has standard tariffs (econom=28, standart=30)', () => {
        const izhevsk = cityTariffs['Ижевск'];
        expect(izhevsk.econom).toBe(28);
        expect(izhevsk.standart).toBe(30);
    });
});

// ─── Parametrized: specific high-rate cities ─────────────────────────────────

describe('new territory cities have elevated rates', () => {
    const newTerritoryCities = ['Мариуполь', 'Мелитополь'];

    it.each(newTerritoryCities)('city "%s" has econom ≥ 80', (city) => {
        if (!(city in cityTariffs)) return; // skip if not in data
        expect(cityTariffs[city].econom).toBeGreaterThanOrEqual(80);
    });

    it.each(newTerritoryCities)('city "%s" has business ≥ 100', (city) => {
        if (!(city in cityTariffs)) return;
        expect(cityTariffs[city].business).toBeGreaterThanOrEqual(100);
    });
});
