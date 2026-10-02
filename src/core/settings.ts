import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: false,
  hapticsEnabled: true,
  notificationsEnabled: true,
};

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function sanitizeSettings(value: unknown): Settings {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    focusMinutes: clamp(source.focusMinutes, 1, 180, DEFAULT_SETTINGS.focusMinutes),
    shortBreakMinutes: clamp(
      source.shortBreakMinutes,
      1,
      60,
      DEFAULT_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clamp(
      source.longBreakMinutes,
      1,
      90,
      DEFAULT_SETTINGS.longBreakMinutes,
    ),
    longBreakInterval: clamp(
      source.longBreakInterval,
      2,
      12,
      DEFAULT_SETTINGS.longBreakInterval,
    ),
    soundEnabled:
      typeof source.soundEnabled === 'boolean'
        ? source.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    hapticsEnabled:
      typeof source.hapticsEnabled === 'boolean'
        ? source.hapticsEnabled
        : DEFAULT_SETTINGS.hapticsEnabled,
    notificationsEnabled:
      typeof source.notificationsEnabled === 'boolean'
        ? source.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
  };
}
