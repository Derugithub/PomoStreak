/** Countdown clock. Minutes may exceed 59. Uses ceil so 25:00 holds until a full second elapses. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutesLabel(minutes: number): string {
  return `${minutes} min`;
}
