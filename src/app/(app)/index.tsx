import { PrimaryButton, TextButton } from '@/components/buttons';
import { TimerRing } from '@/components/timer-ring';
import { theme, space } from '@/constants/theme';
import { cycleCaption, phaseLabel, ringProgress, visibleRemainingMs } from '@/core/session';
import { formatClock } from '@/core/format';
import { useApp } from '@/state/app-state';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 200);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running]);

  return now;
}

export default function TimerScreen() {
  const { timer, streak, settings, lastNote, start, pause, reset, skip } = useApp();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const running = timer.status === 'running';
  const now = useNow(running);
  const remaining = visibleRemainingMs(timer, now);
  const progress = ringProgress(timer, now);
  const ringSize = Math.max(210, Math.min(300, width - 72, height * 0.42));
  const digitSize = Math.round(ringSize * 0.22);

  const primaryLabel =
    timer.status === 'running'
      ? 'Pause'
      : timer.status === 'paused'
        ? 'Resume'
        : timer.phase === 'focus'
          ? 'Start focus'
          : timer.phase === 'longBreak'
            ? 'Start long break'
            : 'Start break';

  const firstRun =
    streak.current === 0 &&
    streak.longest === 0 &&
    streak.todayCount === 0 &&
    timer.phase === 'focus' &&
    timer.status === 'idle';

  const note = lastNote ?? (firstRun ? 'The day counts when this focus block finishes.' : null);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
      <View style={styles.frame}>
        <View style={styles.header}>
          <Text style={styles.brand}>PomoStreak</Text>
          <View style={[styles.pill, streak.todayCount > 0 && styles.pillActive]}>
            <Text style={[styles.pillText, streak.todayCount > 0 && styles.pillTextActive]}>
              {streak.todayCount} today
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.phase}>{phaseLabel(timer.phase)}</Text>
          <TimerRing size={ringSize} progress={progress}>
            <Text
              style={[styles.clock, { fontSize: digitSize }]}
              accessibilityRole="timer"
              accessibilityLabel={`${phaseLabel(timer.phase)}, ${formatClock(remaining)} remaining`}>
              {formatClock(remaining)}
            </Text>
          </TimerRing>
          <Text style={styles.caption}>
            {cycleCaption(timer.phase, timer.focusesSinceLongBreak, settings.longBreakInterval)}
          </Text>
          {note ? <Text style={styles.note}>{note}</Text> : <View style={styles.noteSpacer} />}
        </View>

        <View style={styles.controls}>
          <PrimaryButton
            label={primaryLabel}
            variant={running ? 'quiet' : 'accent'}
            onPress={running ? pause : start}
          />
          <View style={styles.secondary}>
            <TextButton label="Skip" onPress={skip} />
            <TextButton label="Reset" onPress={reset} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  brand: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.accentMuted,
    borderColor: 'transparent',
  },
  pillText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: theme.accent,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  phase: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  clock: {
    color: theme.text,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    includeFontPadding: false,
  },
  caption: {
    color: theme.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  note: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  noteSpacer: {
    height: 20,
  },
  controls: {
    gap: space.sm,
    paddingBottom: space.sm,
  },
  secondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.md,
  },
});
