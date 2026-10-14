import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidIsoCalendarDate } from '../src/utils/date-validation.js';

test('isValidIsoCalendarDate correctly validates dates', async (t) => {
    await t.test('accepts valid ISO dates', () => {
        assert.equal(isValidIsoCalendarDate('2023-10-15'), true);
        assert.equal(isValidIsoCalendarDate('2024-02-29'), true); // Leap year
        assert.equal(isValidIsoCalendarDate('2000-01-01'), true);
    });

    await t.test('rejects invalid formats', () => {
        assert.equal(isValidIsoCalendarDate('2023/10/15'), false);
        assert.equal(isValidIsoCalendarDate('10-15-2023'), false);
        assert.equal(isValidIsoCalendarDate('2023-10-15T00:00:00Z'), false);
        assert.equal(isValidIsoCalendarDate('20231015'), false);
        assert.equal(isValidIsoCalendarDate(' 2023-10-15 '), false);
        assert.equal(isValidIsoCalendarDate('23-10-15'), false);
    });

    await t.test('rejects out of bounds and non-existent dates', () => {
        assert.equal(isValidIsoCalendarDate('2023-13-01'), false); // Month 13
        assert.equal(isValidIsoCalendarDate('2023-00-01'), false); // Month 0
        assert.equal(isValidIsoCalendarDate('2023-01-32'), false); // Day 32
        assert.equal(isValidIsoCalendarDate('2023-01-00'), false); // Day 0
        assert.equal(isValidIsoCalendarDate('2023-02-29'), false); // Not a leap year
        assert.equal(isValidIsoCalendarDate('2023-04-31'), false); // April has 30 days
    });

    await t.test('rejects missing or empty values', () => {
        assert.equal(isValidIsoCalendarDate(''), false);
        assert.equal(isValidIsoCalendarDate(null), false);
        assert.equal(isValidIsoCalendarDate(undefined), false);
        assert.equal(isValidIsoCalendarDate(), false);
        assert.equal(isValidIsoCalendarDate(12345), false);
    });
});
