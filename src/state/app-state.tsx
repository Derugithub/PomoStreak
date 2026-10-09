import {
  completeRunningTimer,
  completionCopy,
  createInitialTimer,
  emptyHistory,
  pauseTimer,
  resetPhase,
  resumeTimer,
  skipPhase,
  applySettingsToTimer,
} from '@/core/session';
import { createId } from '@/core/id';
import { toDateKey } from '@/core/dates';
import { computeStreak } from '@/core/streak';
import { DEFAULT_SETTINGS, sanitizeSettings } from '@/core/settings';
import type { CompletedSession, HistoryState, Settings, StreakStats, TimerModel } from '@/core/types';
import {
  cancelSessionNotifications,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleSessionEnd,
} from '@/services/notifications';
import { playSessionFeedback, playTap } from '@/services/feedback';
import {
  loadSnapshot,
  saveHistory,
  saveOnboardingComplete,
  saveSettings,
  saveTimer,
} from '@/storage/repository';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

interface Snapshot {
  timer: TimerModel;
  history: HistoryState;
  settings: Settings;
}

interface AppContextValue {
  ready: boolean;
  onboardingComplete: boolean;
  settings: Settings;
  timer: TimerModel;
  streak: StreakStats;
  todayKey: string;
  todaySessions: CompletedSession[];
  lastNote: string | null;
  completeOnboarding: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

async function armNotification(
  timer: TimerModel,
  settings: Settings,
  requestPermission: boolean,
): Promise<Settings> {
  await cancelSessionNotifications();
  if (!settings.notificationsEnabled || timer.status !== 'running' || timer.endsAt == null) {
    return settings;
  }

  let allowed = await hasNotificationPermission();
  if (!allowed && requestPermission) {
    allowed = await requestNotificationPermission();
  }
  if (!allowed) {
    return requestPermission ? { ...settings, notificationsEnabled: false } : settings;
  }

  const copy = completionCopy(
    timer.phase,
    timer.focusesSinceLongBreak,
    settings.longBreakInterval,
  );
  await scheduleSessionEnd({ endsAt: timer.endsAt, title: copy.title, body: copy.body });
  return settings;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryState>(emptyHistory());
  const [timer, setTimer] = useState<TimerModel>(() => createInitialTimer(DEFAULT_SETTINGS));
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));

  const snapshot = useRef<Snapshot>({
    timer,
    history,
    settings,
  });
  useEffect(() => {
    snapshot.current = { timer, history, settings };
  }, [timer, history, settings]);
  const completing = useRef(false);

  const commit = useCallback((next: Partial<Snapshot>, note?: string | null) => {
    const merged: Snapshot = { ...snapshot.current, ...next };
    snapshot.current = merged;
    if (next.timer) setTimer(next.timer);
    if (next.history) setHistory(next.history);
    if (next.settings) setSettings(next.settings);
    if (note !== undefined) setLastNote(note);
    if (next.timer) void saveTimer(next.timer).catch(() => {});
    if (next.history) void saveHistory(next.history).catch(() => {});
    if (next.settings) void saveSettings(next.settings).catch(() => {});
  }, []);

  const completeIfDue = useCallback(
    (nowMs: number, allowFeedback: boolean) => {
      const current = snapshot.current;
      const { timer: active, history: activeHistory, settings: activeSettings } = current;
      if (completing.current) return;
      if (active.status !== 'running' || active.endsAt == null || nowMs < active.endsAt) return;

      completing.current = true;
      const copy = completionCopy(
        active.phase,
        active.focusesSinceLongBreak,
        activeSettings.longBreakInterval,
      );
      const result = completeRunningTimer(
        active,
        activeHistory,
        activeSettings,
        nowMs,
        createId,
      );
      if (!result.completed || result.timer.status === 'running') {
        completing.current = false;
        return;
      }

      commit({ timer: result.timer, history: result.history }, copy.title);
      void cancelSessionNotifications();
      const endedAt = active.endsAt;
      if (allowFeedback && nowMs - endedAt < 15_000) {
        void playSessionFeedback(activeSettings);
      }
    },
    [commit],
  );

  useEffect(() => {
    if (timer.status !== 'running') completing.current = false;
  }, [timer.status]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadSnapshot();
      if (cancelled) return;

      let nextTimer = loaded.timer;
      let nextHistory = loaded.history;
      let note: string | null = null;

      if (
        nextTimer.status === 'running' &&
        nextTimer.endsAt != null &&
        nextTimer.endsAt <= Date.now()
      ) {
        const copy = completionCopy(
          nextTimer.phase,
          nextTimer.focusesSinceLongBreak,
          loaded.settings.longBreakInterval,
        );
        const result = completeRunningTimer(
          nextTimer,
          nextHistory,
          loaded.settings,
          Date.now(),
          createId,
        );
        if (result.completed) {
          nextTimer = result.timer;
          nextHistory = result.history;
          note = copy.title;
          await Promise.all([
            saveTimer(nextTimer).catch(() => {}),
            saveHistory(nextHistory).catch(() => {}),
            cancelSessionNotifications(),
          ]);
        }
      } else if (nextTimer.status === 'running') {
        void armNotification(nextTimer, loaded.settings, false);
      }

      if (cancelled) return;
      snapshot.current = {
        timer: nextTimer,
        history: nextHistory,
        settings: loaded.settings,
      };
      setSettings(loaded.settings);
      setHistory(nextHistory);
      setTimer(nextTimer);
      setLastNote(note);
      setOnboardingComplete(loaded.onboardingComplete);
      setTodayKey(toDateKey(new Date()));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || timer.status !== 'running') return;
    const tick = () => {
      completeIfDue(Date.now(), AppState.currentState === 'active');
    };
    tick();
    const interval = setInterval(tick, 250);
    const subscription = AppState.addEventListener('change', tick);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [ready, timer.status, timer.endsAt, completeIfDue]);

  useEffect(() => {
    const refreshDay = () => setTodayKey(toDateKey(new Date()));
    const interval = setInterval(refreshDay, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDay();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    void saveOnboardingComplete(true).catch(() => {});
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const current = snapshot.current;
      const nextSettings = sanitizeSettings({ ...current.settings, ...patch });
      const nextTimer = applySettingsToTimer(current.timer, current.settings, nextSettings);
      commit({ settings: nextSettings, timer: nextTimer });
      if (!nextSettings.notificationsEnabled) {
        void cancelSessionNotifications();
      } else if (nextTimer.status === 'running') {
        void armNotification(nextTimer, nextSettings, false);
      }
    },
    [commit],
  );

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        updateSettings({ notificationsEnabled: false });
        return;
      }
      const allowed = await requestNotificationPermission();
      updateSettings({ notificationsEnabled: allowed });
    },
    [updateSettings],
  );

  const start = useCallback(() => {
    const current = snapshot.current;
    if (current.timer.status === 'running') return;
    const next = resumeTimer(current.timer, Date.now());
    commit({ timer: next }, null);
    void playTap(current.settings);
    void (async () => {
      const before = snapshot.current.settings;
      if (!before.notificationsEnabled) return;
      let allowed = await hasNotificationPermission();
      if (!allowed) allowed = await requestNotificationPermission();
      const latest = snapshot.current;
      if (!allowed) {
        await cancelSessionNotifications();
        if (latest.settings.notificationsEnabled) {
          commit({ settings: { ...latest.settings, notificationsEnabled: false } });
        }
        return;
      }
      if (latest.timer.status !== 'running' || latest.timer.endsAt == null) return;
      await armNotification(latest.timer, latest.settings, false);
    })();
  }, [commit]);

  const pause = useCallback(() => {
    const current = snapshot.current;
    const next = pauseTimer(current.timer, Date.now());
    if (next === current.timer) return;
    commit({ timer: next });
    void cancelSessionNotifications();
    void playTap(current.settings);
  }, [commit]);

  const reset = useCallback(() => {
    const next = resetPhase(snapshot.current.timer);
    commit({ timer: next }, null);
    void cancelSessionNotifications();
  }, [commit]);

  const skip = useCallback(() => {
    const current = snapshot.current;
    const next = skipPhase(current.timer, current.settings);
    commit({ timer: next }, null);
    void cancelSessionNotifications();
  }, [commit]);

  const streak = useMemo(
    () => computeStreak(history.focusDayCounts, todayKey),
    [history.focusDayCounts, todayKey],
  );

  const todaySessions = useMemo(
    () => history.sessions.filter((session) => session.dateKey === todayKey),
    [history.sessions, todayKey],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      onboardingComplete,
      settings,
      timer,
      streak,
      todayKey,
      todaySessions,
      lastNote,
      completeOnboarding,
      updateSettings,
      setNotificationsEnabled,
      start,
      pause,
      reset,
      skip,
    }),
    [
      ready,
      onboardingComplete,
      settings,
      timer,
      streak,
      todayKey,
      todaySessions,
      lastNote,
      completeOnboarding,
      updateSettings,
      setNotificationsEnabled,
      start,
      pause,
      reset,
      skip,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within AppProvider');
  }
  return value;
}
