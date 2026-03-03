/**
 * checkpoints.test.ts — Tests for src/data/checkpoints.ts
 * Skill applied: javascript-testing-patterns
 * Patterns: test.each, edge cases, false-positive detection
 */
import { describe, it, expect } from 'vitest';
import { checkpoints, requiresCheckpoint, NEW_TERRITORY_CITIES } from '@/data/checkpoints';

// ─── checkpoints data integrity ───────────────────────────────────────────────

describe('checkpoints data', () => {
    it('has at least 5 checkpoints', () => {
        expect(checkpoints.length).toBeGreaterThanOrEqual(5);
    });

    it('every checkpoint has id, name, and coords [lat, lon]', () => {
        for (const cp of checkpoints) {
            expect(cp.id).toBeTruthy();
            expect(cp.name).toBeTruthy();
            expect(cp.coords).toHaveLength(2);
            expect(cp.coords[0]).toBeGreaterThan(0); // latitude
            expect(cp.coords[1]).toBeGreaterThan(0); // longitude
        }
    });

    it('all checkpoint ids are unique', () => {
        const ids = checkpoints.map(cp => cp.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('contains КПП Успенка', () => {
        expect(checkpoints.some(cp => cp.name.includes('Успенка'))).toBe(true);
    });
});

// ─── NEW_TERRITORY_CITIES ─────────────────────────────────────────────────────

describe('NEW_TERRITORY_CITIES', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(NEW_TERRITORY_CITIES)).toBe(true);
        expect(NEW_TERRITORY_CITIES.length).toBeGreaterThan(0);
    });

    it('all entries are lowercase strings', () => {
        for (const city of NEW_TERRITORY_CITIES) {
            expect(city).toBe(city.toLowerCase());
        }
    });

    it('contains key cities: мариуполь, симферополь, херсон', () => {
        expect(NEW_TERRITORY_CITIES).toContain('мариуполь');
        expect(NEW_TERRITORY_CITIES).toContain('симферополь');
        expect(NEW_TERRITORY_CITIES).toContain('херсон');
    });
});

// ─── requiresCheckpoint ───────────────────────────────────────────────────────

describe('requiresCheckpoint', () => {
    // Positive cases — cities that need a checkpoint
    it.each([
        ['Мариуполь'],
        ['мариуполь'],
        ['ДОНЕЦК'],
        ['Симферополь'],
        ['Херсон'],
        ['Луганск'],
        ['Ялта'],
        ['Горловка'],
    ])('returns true for new territory city "%s"', (city) => {
        expect(requiresCheckpoint(city)).toBe(true);
    });

    // Negative cases — Russian cities that should NOT trigger checkpoint
    it.each([
        ['Москва'],
        ['Санкт-Петербург'],
        ['Ижевск'],
        ['Казань'],
        ['Пермь'],
        ['Самара'],
        ['Ростов на Дону'],
    ])('returns false for Russian city "%s"', (city) => {
        expect(requiresCheckpoint(city)).toBe(false);
    });

    // False-positive detection
    it('does NOT flag "Свердловская область" as new territory', () => {
        expect(requiresCheckpoint('Свердловская область')).toBe(false);
    });

    it('does NOT flag "Северное Бутово" (Moscow district)', () => {
        expect(requiresCheckpoint('Северное Бутово')).toBe(false);
    });

    it('does NOT flag "Северное Чертаново"', () => {
        expect(requiresCheckpoint('Северное Чертаново')).toBe(false);
    });

    // Edge cases
    it('returns false for empty string', () => {
        expect(requiresCheckpoint('')).toBe(false);
    });

    it('returns false for undefined/null equivalent (empty)', () => {
        expect(requiresCheckpoint('')).toBe(false);
    });

    it('handles mixed case correctly', () => {
        expect(requiresCheckpoint('МАРИУПОЛЬ')).toBe(true);
        expect(requiresCheckpoint('мАрИуПоль')).toBe(true);
    });

    it('detects city in a longer address string', () => {
        expect(requiresCheckpoint('ул. Ленина 1, Донецк')).toBe(true);
    });
});
