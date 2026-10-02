import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeStreak } from './streak';

test('empty history has no streak', () => {
  const stats = computeStreak({}, '2026-10-02');
  assert.deepEqual(stats, {
    current: 0,
    longest: 0,
    todayCount: 0,
    completedDayKeys: [],
  });
});

test('a single focus today starts a one-day streak', () => {
  const stats = computeStreak({ '2026-10-02': 1 }, '2026-10-02');
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 1);
  assert.equal(stats.todayCount, 1);
});

test('several focuses on the same day still count as one streak day', () => {
  const stats = computeStreak({ '2026-10-02': 3 }, '2026-10-02');
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 1);
  assert.equal(stats.todayCount, 3);
});

test('consecutive days ending today extend the current streak', () => {
  const stats = computeStreak(
    {
      '2026-09-30': 1,
      '2026-10-01': 2,
      '2026-10-02': 1,
    },
    '2026-10-02',
  );
  assert.equal(stats.current, 3);
  assert.equal(stats.longest, 3);
});

test('yesterday still counts until today is missed', () => {
  const stats = computeStreak({ '2026-10-01': 1 }, '2026-10-02');
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 1);
  assert.equal(stats.todayCount, 0);
});

test('a gap before yesterday breaks the current streak and keeps the longest run', () => {
  const stats = computeStreak(
    {
      '2026-09-28': 1,
      '2026-09-29': 1,
      '2026-09-30': 1,
      '2026-10-02': 1,
    },
    '2026-10-02',
  );
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 3);
  assert.deepEqual(stats.completedDayKeys, [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-02',
  ]);
});

test('missing yesterday and today clears the current streak', () => {
  const stats = computeStreak({ '2026-09-30': 4 }, '2026-10-02');
  assert.equal(stats.current, 0);
  assert.equal(stats.longest, 1);
});

test('zero counts and future days are ignored', () => {
  const stats = computeStreak(
    {
      '2026-10-01': 0,
      '2026-10-03': 5,
      'not-a-day': 2,
    },
    '2026-10-02',
  );
  assert.equal(stats.current, 0);
  assert.equal(stats.longest, 0);
  assert.deepEqual(stats.completedDayKeys, []);
});
