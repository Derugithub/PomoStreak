import { toDateKey } from './dates';
import type {
  CompletedSession,
  HistoryState,
  SessionKind,
  Settings,
  TimerModel,
} from './types';

export const MAX_STORED_SESSIONS = 180;

const SESSION_KINDS: readonly SessionKind[] = ['focus', 'shortBreak', 'longBreak'];

export function isSessionKind(value: unknown): value is SessionKind {
  return typeof value === 'string' && SESSION_KINDS.includes(value as SessionKind);
}

export function countsTowardStreak(kind: SessionKind): boolean {
  return kind === 'focus';
}

export function durationMsFor(kind: SessionKind, settings: Settings): number {
  const minutes =
    kind === 'focus'
      ? settings.focusMinutes
      : kind === 'shortBreak'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return minutes * 60 * 1000;
}

export function createInitialTimer(settings: Settings): TimerModel {
  const plannedMs = durationMsFor('focus', settings);
  return {
    phase: 'focus',
    status: 'idle',
    endsAt: null,
    remainingMs: plannedMs,
    plannedMs,
    focusesSinceLongBreak: 0,
  };
}

export function phaseLabel(phase: SessionKind): string {
  if (phase === 'focus') return 'Focus';
  if (phase === 'shortBreak') return 'Short break';
  return 'Long break';
}

export function cycleCaption(
  phase: SessionKind,
  focusesSinceLongBreak: number,
  interval: number,
): string {
  if (phase === 'longBreak') return 'Cycle complete';
  const done = Math.min(Math.max(0, focusesSinceLongBreak), interval);
  if (phase === 'shortBreak') return `${done} of ${interval} toward a long break`;
  const current = Math.min(done + 1, interval);
  return `${current} of ${interval} toward a long break`;
}

export function completionCopy(
  phase: SessionKind,
  focusesSinceLongBreak: number,
  interval: number,
): { title: string; body: string } {
  if (phase === 'focus') {
    const longBreakNext = focusesSinceLongBreak + 1 >= interval;
    return {
      title: 'Focus complete',
      body: longBreakNext ? 'A long break is ready.' : 'A short break is ready.',
    };
  }
  if (phase === 'longBreak') {
    return { title: 'Long break complete', body: 'The next focus block is ready.' };
  }
  return { title: 'Break complete', body: 'The next focus block is ready.' };
}

export function visibleRemainingMs(timer: TimerModel, nowMs: number): number {
  if (timer.status === 'running' && timer.endsAt != null) {
    return Math.max(0, timer.endsAt - nowMs);
  }
  return Math.max(0, timer.remainingMs);
}

export function ringProgress(timer: TimerModel, nowMs: number): number {
  if (timer.plannedMs <= 0) return 0;
  return Math.min(1, Math.max(0, visibleRemainingMs(timer, nowMs) / timer.plannedMs));
}

function nextAfterFocus(focusesSinceLongBreak: number, interval: number): {
  focusesSinceLongBreak: number;
  phase: SessionKind;
} {
  const nextCount = focusesSinceLongBreak + 1;
  if (nextCount >= interval) {
    return { focusesSinceLongBreak: nextCount, phase: 'longBreak' };
  }
  return { focusesSinceLongBreak: nextCount, phase: 'shortBreak' };
}

function nextAfterBreak(
  phase: 'shortBreak' | 'longBreak',
  focusesSinceLongBreak: number,
): { focusesSinceLongBreak: number; phase: 'focus' } {
  return {
    phase: 'focus',
    focusesSinceLongBreak: phase === 'longBreak' ? 0 : focusesSinceLongBreak,
  };
}

export interface CompletionResult {
  timer: TimerModel;
  history: HistoryState;
  completed: CompletedSession | null;
}

/**
 * If a running timer has reached its absolute end time, record the session and
 * arm the next phase. Breaks are stored but do not change streak day counts.
 * The session is dated from endsAt, not from when the app next opened.
 */
export function completeRunningTimer(
  timer: TimerModel,
  history: HistoryState,
  settings: Settings,
  nowMs: number,
  createId: () => string,
): CompletionResult {
  if (timer.status !== 'running' || timer.endsAt == null || nowMs < timer.endsAt) {
    return { timer, history, completed: null };
  }

  const completedAtMs = timer.endsAt;
  const session: CompletedSession = {
    id: createId(),
    kind: timer.phase,
    durationSeconds: Math.max(1, Math.round(timer.plannedMs / 1000)),
    completedAt: new Date(completedAtMs).toISOString(),
    dateKey: toDateKey(new Date(completedAtMs)),
  };

  const sessions = [session, ...history.sessions].slice(0, MAX_STORED_SESSIONS);
  let focusDayCounts = history.focusDayCounts;
  let focusesSinceLongBreak = timer.focusesSinceLongBreak;
  let nextPhase: SessionKind = 'focus';

  if (countsTowardStreak(timer.phase)) {
    focusDayCounts = {
      ...focusDayCounts,
      [session.dateKey]: (focusDayCounts[session.dateKey] ?? 0) + 1,
    };
    const next = nextAfterFocus(focusesSinceLongBreak, settings.longBreakInterval);
    focusesSinceLongBreak = next.focusesSinceLongBreak;
    nextPhase = next.phase;
  } else if (timer.phase === 'longBreak') {
    const next = nextAfterBreak('longBreak', focusesSinceLongBreak);
    focusesSinceLongBreak = next.focusesSinceLongBreak;
    nextPhase = next.phase;
  } else {
    const next = nextAfterBreak('shortBreak', focusesSinceLongBreak);
    focusesSinceLongBreak = next.focusesSinceLongBreak;
    nextPhase = next.phase;
  }

  const plannedMs = durationMsFor(nextPhase, settings);

  return {
    completed: session,
    history: { sessions, focusDayCounts },
    timer: {
      phase: nextPhase,
      status: 'idle',
      endsAt: null,
      remainingMs: plannedMs,
      plannedMs,
      focusesSinceLongBreak,
    },
  };
}

/** Leave the current phase without counting it. */
export function skipPhase(timer: TimerModel, settings: Settings): TimerModel {
  let phase: SessionKind;
  let focusesSinceLongBreak = timer.focusesSinceLongBreak;

  if (timer.phase === 'focus') {
    phase = focusesSinceLongBreak >= settings.longBreakInterval ? 'longBreak' : 'shortBreak';
  } else if (timer.phase === 'longBreak') {
    phase = 'focus';
    focusesSinceLongBreak = 0;
  } else {
    phase = 'focus';
  }

  const plannedMs = durationMsFor(phase, settings);
  return {
    phase,
    status: 'idle',
    endsAt: null,
    remainingMs: plannedMs,
    plannedMs,
    focusesSinceLongBreak,
  };
}

export function resetPhase(timer: TimerModel): TimerModel {
  return {
    ...timer,
    status: 'idle',
    endsAt: null,
    remainingMs: timer.plannedMs,
  };
}

export function pauseTimer(timer: TimerModel, nowMs: number): TimerModel {
  if (timer.status !== 'running' || timer.endsAt == null) return timer;
  return {
    ...timer,
    status: 'paused',
    endsAt: null,
    remainingMs: Math.max(0, timer.endsAt - nowMs),
  };
}

export function resumeTimer(timer: TimerModel, nowMs: number): TimerModel {
  if (timer.status === 'running') return timer;
  const remainingMs = timer.remainingMs > 0 ? timer.remainingMs : timer.plannedMs;
  return {
    ...timer,
    status: 'running',
    remainingMs,
    endsAt: nowMs + remainingMs,
  };
}

/** Keep a running session intact. Snap an untouched idle timer to the new duration. */
export function applySettingsToTimer(
  timer: TimerModel,
  previous: Settings,
  next: Settings,
): TimerModel {
  const plannedMs = durationMsFor(timer.phase, next);
  if (timer.status === 'running') {
    return { ...timer, plannedMs: timer.plannedMs };
  }
  const previousPlanned = durationMsFor(timer.phase, previous);
  const untouched = timer.status === 'idle' && timer.remainingMs === previousPlanned;
  return {
    ...timer,
    plannedMs,
    remainingMs: untouched ? plannedMs : Math.min(timer.remainingMs, plannedMs),
  };
}

export function emptyHistory(): HistoryState {
  return { sessions: [], focusDayCounts: {} };
}

export function sanitizeHistory(value: unknown): HistoryState {
  if (!value || typeof value !== 'object') return emptyHistory();
  const source = value as Record<string, unknown>;
  const focusDayCounts: Record<string, number> = {};

  if (source.focusDayCounts && typeof source.focusDayCounts === 'object') {
    for (const [key, count] of Object.entries(source.focusDayCounts as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      if (typeof count !== 'number' || !Number.isFinite(count) || count < 1) continue;
      focusDayCounts[key] = Math.round(count);
    }
  }

  const sessions: CompletedSession[] = [];
  if (Array.isArray(source.sessions)) {
    for (const item of source.sessions) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== 'string' || !isSessionKind(row.kind)) continue;
      if (typeof row.completedAt !== 'string' || typeof row.dateKey !== 'string') continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.dateKey)) continue;
      if (typeof row.durationSeconds !== 'number' || !Number.isFinite(row.durationSeconds)) continue;
      sessions.push({
        id: row.id,
        kind: row.kind,
        completedAt: row.completedAt,
        dateKey: row.dateKey,
        durationSeconds: Math.max(1, Math.round(row.durationSeconds)),
      });
      if (sessions.length >= MAX_STORED_SESSIONS) break;
    }
  }

  return { sessions, focusDayCounts };
}

export function sanitizeTimer(value: unknown, settings: Settings): TimerModel {
  const fallback = createInitialTimer(settings);
  if (!value || typeof value !== 'object') return fallback;
  const source = value as Record<string, unknown>;
  const phase = isSessionKind(source.phase) ? source.phase : fallback.phase;
  const status =
    source.status === 'running' || source.status === 'paused' || source.status === 'idle'
      ? source.status
      : 'idle';
  const plannedFallback = durationMsFor(phase, settings);
  const plannedMs =
    typeof source.plannedMs === 'number' && source.plannedMs > 0
      ? source.plannedMs
      : plannedFallback;
  const remainingMs =
    typeof source.remainingMs === 'number' && Number.isFinite(source.remainingMs)
      ? Math.max(0, source.remainingMs)
      : plannedMs;
  const focusesSinceLongBreak =
    typeof source.focusesSinceLongBreak === 'number' && source.focusesSinceLongBreak >= 0
      ? Math.round(source.focusesSinceLongBreak)
      : 0;
  const endsAt =
    status === 'running' && typeof source.endsAt === 'number' && Number.isFinite(source.endsAt)
      ? source.endsAt
      : null;

  if (status === 'running' && endsAt == null) {
    return {
      phase,
      status: 'idle',
      endsAt: null,
      remainingMs: plannedMs,
      plannedMs,
      focusesSinceLongBreak,
    };
  }

  return {
    phase,
    status,
    endsAt,
    remainingMs,
    plannedMs,
    focusesSinceLongBreak,
  };
}
