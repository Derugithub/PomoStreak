import { Card, Screen } from '@/components/screen';
import { theme, space } from '@/constants/theme';
import { WEEKDAY_LABELS, buildMonthCells, parseDateKey, weekDateKeys } from '@/core/dates';
import { phaseLabel } from '@/core/session';
import { useApp } from '@/state/app-state';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function formatSessionTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function DayMark({
  label,
  filled,
  today,
  muted,
}: {
  label: string;
  filled: boolean;
  today: boolean;
  muted?: boolean;
}) {
  return (
    <View
      style={[
        styles.dayMark,
        filled && styles.dayFilled,
        today && !filled && styles.dayToday,
      ]}>
      <Text
        style={[
          styles.dayMarkText,
          filled && styles.dayFilledText,
          muted && !filled && styles.dayMuted,
        ]}>
        {label}
      </Text>
    </View>
  );
}

export default function StreakScreen() {
  const { streak, todayKey, todaySessions } = useApp();
  const today = parseDateKey(todayKey);
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const completed = useMemo(() => new Set(streak.completedDayKeys), [streak.completedDayKeys]);
  const week = weekDateKeys(todayKey);
  const cells = buildMonthCells(cursor.year, cursor.month);
  const monthTitle = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const atCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      if (
        next.getFullYear() > today.getFullYear() ||
        (next.getFullYear() === today.getFullYear() && next.getMonth() > today.getMonth())
      ) {
        return current;
      }
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const streakLine =
    streak.current === 0 && streak.longest === 0
      ? 'Finish one focus session and this day joins the streak. Breaks stay off the record.'
      : streak.current === 0
        ? 'The chain paused after a missed day. One finished focus starts it again.'
        : streak.todayCount === 0
          ? 'Yesterday still counts. Finish a focus block today to extend it.'
          : 'This day is on the streak.';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Streak</Text>
        <Text style={styles.hero} accessibilityRole="header">
          {streak.current}
        </Text>
        <Text style={styles.heroLabel}>{streak.current === 1 ? 'day' : 'days'} in a row</Text>
        <Text style={styles.lead}>{streakLine}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak.longest}</Text>
          <Text style={styles.statLabel}>Longest</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak.todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.cardTitle}>This week</Text>
        <View style={styles.weekRow}>
          {week.map((dateKey, index) => {
            const day = parseDateKey(dateKey).getDate();
            return (
              <View key={dateKey} style={styles.weekCell}>
                <Text style={styles.weekday}>{WEEKDAY_LABELS[index]}</Text>
                <DayMark
                  label={String(day)}
                  filled={completed.has(dateKey)}
                  today={dateKey === todayKey}
                  muted={dateKey > todayKey}
                />
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={styles.monthHeader}>
          <Text style={styles.cardTitle}>{monthTitle}</Text>
          <View style={styles.monthNav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => shiftMonth(-1)}>
              <Text style={styles.navText}>Prev</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              hitSlop={8}
              disabled={atCurrentMonth}
              onPress={() => shiftMonth(1)}>
              <Text style={[styles.navText, atCurrentMonth && styles.navDisabled]}>Next</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.weekday, styles.monthWeekday]}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {cells.map((cell, index) => (
            <View key={`${cell.dateKey ?? 'blank'}-${index}`} style={styles.monthCell}>
              {cell.dateKey && cell.day != null ? (
                <DayMark
                  label={String(cell.day)}
                  filled={completed.has(cell.dateKey)}
                  today={cell.dateKey === todayKey}
                  muted={cell.dateKey > todayKey}
                />
              ) : null}
            </View>
          ))}
        </View>
        <Text style={styles.legend}>A marked day has at least one finished focus session.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Today</Text>
        {todaySessions.length === 0 ? (
          <Text style={styles.empty}>Finished blocks show up here with the time they ended.</Text>
        ) : (
          todaySessions.map((session) => (
            <View key={session.id} style={styles.session}>
              <View style={styles.sessionCopy}>
                <Text style={styles.sessionTitle}>{phaseLabel(session.kind)}</Text>
                <Text style={styles.sessionMeta}>{formatSessionTime(session.completedAt)}</Text>
              </View>
              <Text style={styles.sessionDuration}>
                {Math.max(1, Math.round(session.durationSeconds / 60))} min
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space.xs,
  },
  kicker: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hero: {
    color: theme.text,
    fontSize: 72,
    lineHeight: 78,
    fontWeight: '300',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  heroLabel: {
    color: theme.text,
    fontSize: 18,
    marginTop: -4,
  },
  lead: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: space.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: space.md,
  },
  stat: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    gap: 4,
  },
  statValue: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  cardTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekCell: {
    alignItems: 'center',
    gap: space.sm,
    flex: 1,
  },
  weekday: {
    color: theme.textDim,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthWeekday: {
    flex: 1,
  },
  dayMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFilled: {
    backgroundColor: theme.accent,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: theme.accent,
  },
  dayMarkText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  dayFilledText: {
    color: theme.onAccent,
    fontWeight: '700',
  },
  dayMuted: {
    color: theme.textDim,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  monthNav: {
    flexDirection: 'row',
    gap: space.md,
  },
  navText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  navDisabled: {
    opacity: 0.35,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  legend: {
    color: theme.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  sessionCopy: {
    gap: 2,
  },
  sessionTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionMeta: {
    color: theme.textMuted,
    fontSize: 13,
  },
  sessionDuration: {
    color: theme.textMuted,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
