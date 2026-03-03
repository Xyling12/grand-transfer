/**
 * translations.test.ts — Tests for src/lib/translations.ts
 * Skill applied: javascript-testing-patterns
 * Patterns: test.each (parametrize), unit tests, edge cases
 */
import { describe, it, expect } from 'vitest';
import {
    translateTariff,
    translateStatus,
    translateRole,
    translateDriverStatus,
} from '@/lib/translations';

// ─── translateTariff ──────────────────────────────────────────────────────────

describe('translateTariff', () => {
    it.each([
        ['standart', 'Стандарт'],
        ['econom', 'Эконом'],
        ['comfort', 'Комфорт'],
        ['minivan', 'Минивэн'],
        ['business', 'Бизнес'],
    ])('translates "%s" → "%s"', (input, expected) => {
        expect(translateTariff(input)).toBe(expected);
    });

    it('is case-insensitive (STANDART → Стандарт)', () => {
        expect(translateTariff('STANDART')).toBe('Стандарт');
        expect(translateTariff('ECONOM')).toBe('Эконом');
    });

    it('returns unknown tariff as-is', () => {
        expect(translateTariff('vip')).toBe('vip');
        expect(translateTariff('UNKNOWN')).toBe('UNKNOWN');
    });

    it('handles empty string (returns empty)', () => {
        expect(translateTariff('')).toBe('');
    });
});

// ─── translateStatus ──────────────────────────────────────────────────────────

describe('translateStatus', () => {
    it.each([
        ['NEW', undefined, 'Новая'],
        ['DISPATCHED', undefined, 'Поиск водителя'],
        ['TAKEN', undefined, 'Взят в работу'],
        ['COMPLETED', undefined, 'Выполнена'],
        ['CANCELLED', undefined, 'Отменена'],
    ])('translates status "%s" correctly', (status, role, expected) => {
        expect(translateStatus(status, role)).toBe(expected);
    });

    it('PROCESSING for DISPATCHER → "В обработке"', () => {
        expect(translateStatus('PROCESSING', 'DISPATCHER')).toBe('В обработке');
    });

    it('PROCESSING for driver → "У диспетчера"', () => {
        expect(translateStatus('PROCESSING', 'DRIVER')).toBe('У диспетчера');
        expect(translateStatus('PROCESSING')).toBe('У диспетчера');
    });

    it('unknown status returned as-is', () => {
        expect(translateStatus('WEIRD_STATUS')).toBe('WEIRD_STATUS');
    });
});

// ─── translateRole ────────────────────────────────────────────────────────────

describe('translateRole', () => {
    it.each([
        ['ADMIN', 'Админ'],
        ['DISPATCHER', 'Диспетчер'],
        ['DRIVER', 'Водитель'],
        ['USER', 'Пользователь'],
    ])('translates role "%s" → "%s"', (role, expected) => {
        expect(translateRole(role)).toBe(expected);
    });

    it('unknown role returned as-is', () => {
        expect(translateRole('SUPERADMIN')).toBe('SUPERADMIN');
    });
});

// ─── translateDriverStatus ────────────────────────────────────────────────────

describe('translateDriverStatus', () => {
    it.each([
        ['PENDING', 'Ожидает'],
        ['APPROVED', 'Одобрен'],
        ['BANNED', 'Блок'],
    ])('translates driver status "%s" → "%s"', (status, expected) => {
        expect(translateDriverStatus(status)).toBe(expected);
    });

    it('unknown status returned as-is', () => {
        expect(translateDriverStatus('SUSPENDED')).toBe('SUSPENDED');
    });
});
