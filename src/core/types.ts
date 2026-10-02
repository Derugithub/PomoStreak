export type SessionKind = 'focus' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Completed focus sessions before a long break is offered. */
  longBreakInterval: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface CompletedSession {
  id: string;
  kind: SessionKind;
  durationSeconds: number;
  /** ISO timestamp for the moment the session reached zero. */
  completedAt: string;
  /** Local calendar day, YYYY-MM-DD. */
  dateKey: string;
}

export interface TimerModel {
  phase: SessionKind;
  status: TimerStatus;
  /** Epoch ms when the running session hits zero. Null when idle or paused. */
  endsAt: number | null;
  remainingMs: number;
  plannedMs: number;
  /** Focus sessions finished since the last long break. */
  focusesSinceLongBreak: number;
}

export interface HistoryState {
  /** Newest first. Trimmed; streak days live in focusDayCounts. */
  sessions: CompletedSession[];
  /** Local date key -> completed focus sessions that day. */
  focusDayCounts: Record<string, number>;
}

export interface StreakStats {
  current: number;
  longest: number;
  todayCount: number;
  completedDayKeys: string[];
}
