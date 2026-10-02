import { addDays, isDateKey } from './dates';
import type { StreakStats } from './types';

/**
 * Current streak is the run of consecutive local days ending today.
 * If today has no completed focus yet, yesterday's run still counts until the day ends.
 * Longest streak is the longest run on record, independent of today.
 */
export function computeStreak(
  focusDayCounts: Record<string, number>,
  todayKey: string,
): StreakStats {
  const completedDayKeys = Object.entries(focusDayCounts)
    .filter(([key, count]) => isDateKey(key) && key <= todayKey && count >= 1)
    .map(([key]) => key)
    .sort();

  const completed = new Set(completedDayKeys);
  const todayCount = completed.has(todayKey) ? Math.round(focusDayCounts[todayKey] ?? 0) : 0;

  const streakEndingAt = (day: string): number => {
    let length = 0;
    let cursor = day;
    while (completed.has(cursor)) {
      length += 1;
      cursor = addDays(cursor, -1);
    }
    return length;
  };

  let current = 0;
  if (completed.has(todayKey)) {
    current = streakEndingAt(todayKey);
  } else {
    const yesterday = addDays(todayKey, -1);
    if (completed.has(yesterday)) current = streakEndingAt(yesterday);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of completedDayKeys) {
    if (previous && addDays(previous, 1) === day) run += 1;
    else run = 1;
    if (run > longest) longest = run;
    previous = day;
  }

  return { current, longest, todayCount, completedDayKeys };
}
