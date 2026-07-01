/** Local-time yyyy-mm-dd for a given date (defaults to now). */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** A warm, human day label: "Today", "Yesterday", or "Mon 3 Jun". */
export function dayLabel(iso: string): string {
  const today = isoDate();
  if (iso === today) return "Today";

  const d = fromIso(iso);
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  if (iso === isoDate(yest)) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Parse a yyyy-mm-dd string into a local Date at midnight. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "9:14 am" style time from a ms timestamp. */
export function timeLabel(ts: number): string {
  return new Date(ts)
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
    .toLowerCase();
}

/** Whole days between a past timestamp and today (0 = today). */
export function daysSince(ts: number): number {
  const now = new Date();
  const then = new Date(ts);
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d1 = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate(),
  ).getTime();
  return Math.max(0, Math.round((d0 - d1) / 86_400_000));
}

/** "today" · "yesterday" · "4 days ago" · "2 wks ago" · "3 mo ago". */
export function relativeDay(ts: number): string {
  const days = daysSince(ts);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 60) return `${Math.round(days / 7)} wks ago`;
  return `${Math.round(days / 30)} mo ago`;
}

/** A gentle greeting keyed to the hour. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
