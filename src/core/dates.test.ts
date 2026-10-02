import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, buildMonthCells, isDateKey, toDateKey, weekDateKeys } from './dates';

test('toDateKey uses the local calendar day', () => {
  assert.equal(toDateKey(new Date(2026, 9, 2, 23, 59)), '2026-10-02');
  assert.equal(toDateKey(new Date(2026, 0, 1)), '2026-01-01');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');
});

test('isDateKey rejects impossible dates', () => {
  assert.equal(isDateKey('2026-10-02'), true);
  assert.equal(isDateKey('2026-02-31'), false);
  assert.equal(isDateKey('10-02-2026'), false);
});

test('weekDateKeys returns the Monday-first week', () => {
  assert.deepEqual(weekDateKeys('2026-10-02'), [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ]);
});

test('buildMonthCells pads October 2026 to start on Thursday', () => {
  const cells = buildMonthCells(2026, 9);
  assert.equal(cells[0]?.dateKey, null);
  assert.equal(cells[3]?.dateKey, '2026-10-01');
  assert.equal(cells.filter((cell) => cell.day != null).length, 31);
  assert.equal(cells.length % 7, 0);
});
