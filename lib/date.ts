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

/** A gentle greeting keyed to the hour. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
