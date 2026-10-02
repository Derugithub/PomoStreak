import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createInitialTimer,
  emptyHistory,
  sanitizeHistory,
  sanitizeTimer,
} from '@/core/session';
import { DEFAULT_SETTINGS, sanitizeSettings } from '@/core/settings';
import type { HistoryState, Settings, TimerModel } from '@/core/types';

const KEYS = {
  settings: 'pomostreak.settings.v1',
  history: 'pomostreak.history.v1',
  timer: 'pomostreak.timer.v1',
  meta: 'pomostreak.meta.v1',
} as const;

export interface PersistedSnapshot {
  settings: Settings;
  history: HistoryState;
  timer: TimerModel;
  onboardingComplete: boolean;
}

function fallbackSnapshot(): PersistedSnapshot {
  return {
    settings: DEFAULT_SETTINGS,
    history: emptyHistory(),
    timer: createInitialTimer(DEFAULT_SETTINGS),
    onboardingComplete: false,
  };
}

async function readJson(key: string): Promise<unknown> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as unknown;
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadSnapshot(): Promise<PersistedSnapshot> {
  try {
    const [settingsRaw, historyRaw, timerRaw, metaRaw] = await Promise.all([
      readJson(KEYS.settings),
      readJson(KEYS.history),
      readJson(KEYS.timer),
      readJson(KEYS.meta),
    ]);
    const settings = sanitizeSettings(settingsRaw ?? DEFAULT_SETTINGS);
    const meta =
      metaRaw && typeof metaRaw === 'object' ? (metaRaw as Record<string, unknown>) : {};
    return {
      settings,
      history: sanitizeHistory(historyRaw ?? emptyHistory()),
      timer: sanitizeTimer(timerRaw, settings),
      onboardingComplete: meta.onboardingComplete === true,
    };
  } catch {
    return fallbackSnapshot();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJson(KEYS.settings, settings);
}

export async function saveHistory(history: HistoryState): Promise<void> {
  await writeJson(KEYS.history, history);
}

export async function saveTimer(timer: TimerModel): Promise<void> {
  await writeJson(KEYS.timer, timer);
}

export async function saveOnboardingComplete(onboardingComplete: boolean): Promise<void> {
  await writeJson(KEYS.meta, { onboardingComplete });
}
