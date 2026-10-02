import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatClock } from './format';

test('formatClock holds the full minute until a second elapses', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(1), '00:01');
  assert.equal(formatClock(1000), '00:01');
  assert.equal(formatClock(59_000), '00:59');
  assert.equal(formatClock(60_000), '01:00');
  assert.equal(formatClock(25 * 60 * 1000), '25:00');
  assert.equal(formatClock(-20), '00:00');
});
