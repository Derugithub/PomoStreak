const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const parsed = parseDateKey(value);
  return toDateKey(parsed) === value;
}

export function parseDateKey(dateKey: string): Date {
  const match = DATE_KEY.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Monday-first week containing todayKey. */
export function weekDateKeys(todayKey: string): string[] {
  const date = parseDateKey(todayKey);
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDays(todayKey, -mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export interface MonthCell {
  dateKey: string | null;
  day: number | null;
}

/** Monday-first month grid, padded to full weeks. */
export function buildMonthCells(year: number, monthIndex: number): MonthCell[] {
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: MonthCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ dateKey: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: toDateKey(new Date(year, monthIndex, day)),
      day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null });
  }

  return cells;
}

export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
