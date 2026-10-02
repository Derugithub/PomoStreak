import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toDateKey } from './dates';
import {
  applySettingsToTimer,
  completeRunningTimer,
  createInitialTimer,
  emptyHistory,
  pauseTimer,
  resetPhase,
  resumeTimer,
  sanitizeHistory,
  skipPhase,
  visibleRemainingMs,
} from './session';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';
import { computeStreak } from './streak';
import type { HistoryState, Settings, TimerModel } from './types';

const settings: Settings = { ...DEFAULT_SETTINGS };

function runningFocus(endsAt: number, focusesSinceLongBreak = 0): TimerModel {
  return {
    phase: 'focus',
    status: 'running',
    endsAt,
    remainingMs: 0,
    plannedMs: 25 * 60 * 1000,
    focusesSinceLongBreak,
  };
}

test('focus completion updates streak and offers a short break', () => {
  const ended = new Date(2026, 9, 2, 15, 0, 0).getTime();
  const result = completeRunningTimer(
    runningFocus(ended),
    emptyHistory(),
    settings,
    ended,
    () => 'focus-1',
  );

  assert.equal(result.completed?.kind, 'focus');
  assert.equal(result.completed?.dateKey, '2026-10-02');
  assert.equal(result.completed?.durationSeconds, 25 * 60);
  assert.equal(result.history.focusDayCounts['2026-10-02'], 1);
  assert.equal(result.timer.phase, 'shortBreak');
  assert.equal(result.timer.status, 'idle');
  assert.equal(result.timer.focusesSinceLongBreak, 1);
  assert.equal(result.timer.remainingMs, 5 * 60 * 1000);

  const streak = computeStreak(result.history.focusDayCounts, '2026-10-02');
  assert.equal(streak.current, 1);
  assert.equal(streak.longest, 1);
  assert.equal(streak.todayCount, 1);
});

test('a break completion is logged and does not update the streak', () => {
  const ended = new Date(2026, 9, 2, 15, 5, 0).getTime();
  const timer: TimerModel = {
    phase: 'shortBreak',
    status: 'running',
    endsAt: ended,
    remainingMs: 0,
    plannedMs: 5 * 60 * 1000,
    focusesSinceLongBreak: 1,
  };
  const result = completeRunningTimer(timer, emptyHistory(), settings, ended, () => 'break-1');

  assert.equal(result.completed?.kind, 'shortBreak');
  assert.deepEqual(result.history.focusDayCounts, {});
  assert.equal(result.timer.phase, 'focus');
  assert.equal(result.timer.focusesSinceLongBreak, 1);
  const streak = computeStreak(result.history.focusDayCounts, '2026-10-02');
  assert.equal(streak.current, 0);
  assert.equal(streak.todayCount, 0);
});

test('a session that ends while the app is closed counts on that calendar day', () => {
  const ended = new Date(2026, 9, 1, 18, 0, 0).getTime();
  const opened = new Date(2026, 9, 2, 9, 0, 0).getTime();
  const result = completeRunningTimer(
    runningFocus(ended),
    emptyHistory(),
    settings,
    opened,
    () => 'late-1',
  );

  assert.equal(result.completed?.dateKey, '2026-10-01');
  const streak = computeStreak(result.history.focusDayCounts, toDateKey(new Date(opened)));
  assert.equal(streak.current, 1);
  assert.equal(streak.todayCount, 0);
  assert.equal(streak.longest, 1);
});

test('four finished focus sessions offer a long break, which resets the cycle', () => {
  let history: HistoryState = emptyHistory();
  let timer = runningFocus(new Date(2026, 9, 2, 9, 0, 0).getTime(), 0);

  for (let index = 0; index < 4; index += 1) {
    const ended = new Date(2026, 9, 2, 9 + index, 0, 0).getTime();
    const focus: TimerModel = {
      ...timer,
      phase: 'focus',
      status: 'running',
      endsAt: ended,
      remainingMs: 0,
      plannedMs: 25 * 60 * 1000,
    };
    const done = completeRunningTimer(focus, history, settings, ended, () => `focus-${index}`);
    history = done.history;
    timer = done.timer;
    if (index < 3) {
      assert.equal(done.timer.phase, 'shortBreak');
      const back = completeRunningTimer(
        {
          ...done.timer,
          status: 'running',
          endsAt: ended + 5 * 60 * 1000,
          remainingMs: 0,
        },
        history,
        settings,
        ended + 5 * 60 * 1000,
        () => `break-${index}`,
      );
      history = back.history;
      timer = back.timer;
      assert.equal(back.timer.phase, 'focus');
    }
  }

  assert.equal(timer.phase, 'longBreak');
  assert.equal(timer.focusesSinceLongBreak, 4);
  assert.equal(computeStreak(history.focusDayCounts, '2026-10-02').todayCount, 4);

  const longEnded = new Date(2026, 9, 2, 13, 15, 0).getTime();
  const afterLong = completeRunningTimer(
    { ...timer, status: 'running', endsAt: longEnded, remainingMs: 0 },
    history,
    settings,
    longEnded,
    () => 'long-1',
  );
  assert.equal(afterLong.timer.phase, 'focus');
  assert.equal(afterLong.timer.focusesSinceLongBreak, 0);
  assert.equal(computeStreak(afterLong.history.focusDayCounts, '2026-10-02').todayCount, 4);
});

test('a running timer that has not ended is left unchanged', () => {
  const timer = runningFocus(2_000);
  const result = completeRunningTimer(timer, emptyHistory(), settings, 1_000, () => 'nope');
  assert.equal(result.completed, null);
  assert.equal(result.timer, timer);
});

test('pause, resume, and skip do not count a focus session', () => {
  const started = resumeTimer(createInitialTimer(settings), 10_000);
  assert.equal(started.status, 'running');
  assert.equal(started.endsAt, 10_000 + 25 * 60 * 1000);

  const paused = pauseTimer(started, 20_000);
  assert.equal(paused.status, 'paused');
  assert.equal(paused.endsAt, null);
  assert.equal(paused.remainingMs, started.endsAt! - 20_000);

  const unfinished = completeRunningTimer(paused, emptyHistory(), settings, 99_000, () => 'x');
  assert.equal(unfinished.completed, null);

  const skipped = skipPhase(paused, settings);
  assert.equal(skipped.phase, 'shortBreak');
  assert.equal(skipped.focusesSinceLongBreak, 0);
  assert.equal(skipped.status, 'idle');

  const reset = resetPhase(started);
  assert.equal(reset.status, 'idle');
  assert.equal(reset.remainingMs, started.plannedMs);
});

test('visible remaining time uses the absolute end while running', () => {
  const timer = runningFocus(10_000);
  timer.remainingMs = 999;
  assert.equal(visibleRemainingMs(timer, 4_000), 6_000);
  const paused = pauseTimer(timer, 4_000);
  assert.equal(visibleRemainingMs(paused, 9_000), 6_000);
});

test('duration edits apply to an idle timer and not a running one', () => {
  const idle = createInitialTimer(settings);
  const next = sanitizeSettings({ ...settings, focusMinutes: 40 });
  const updated = applySettingsToTimer(idle, settings, next);
  assert.equal(updated.plannedMs, 40 * 60 * 1000);
  assert.equal(updated.remainingMs, 40 * 60 * 1000);

  const running = resumeTimer(idle, 0);
  const held = applySettingsToTimer(running, settings, next);
  assert.equal(held.endsAt, running.endsAt);
  assert.equal(held.plannedMs, running.plannedMs);
});

test('sanitizeSettings clamps durations and falls back when stored data is junk', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  const sanitized = sanitizeSettings({
    focusMinutes: 0,
    shortBreakMinutes: 90,
    longBreakMinutes: 15.6,
    longBreakInterval: 1,
    soundEnabled: true,
  });
  assert.equal(sanitized.focusMinutes, 1);
  assert.equal(sanitized.shortBreakMinutes, 60);
  assert.equal(sanitized.longBreakMinutes, 16);
  assert.equal(sanitized.longBreakInterval, 2);
  assert.equal(sanitized.soundEnabled, true);
  assert.equal(sanitized.hapticsEnabled, true);
});

test('sanitizeHistory drops malformed rows and keeps focus day counts', () => {
  const history = sanitizeHistory({
    focusDayCounts: { '2026-10-02': 2, bad: 3, '2026-10-03': 0 },
    sessions: [
      {
        id: 'ok',
        kind: 'focus',
        durationSeconds: 1500,
        completedAt: '2026-10-02T15:00:00.000Z',
        dateKey: '2026-10-02',
      },
      { id: 'nope', kind: 'nap', dateKey: '2026-10-02' },
    ],
  });
  assert.deepEqual(history.focusDayCounts, { '2026-10-02': 2 });
  assert.equal(history.sessions.length, 1);
  assert.equal(history.sessions[0]?.id, 'ok');
});
