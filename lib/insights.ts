import { BabyId, BABIES, FoodCategory, LogEntry } from "./types";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  FOODS,
  getFood,
} from "./foods";
import {
  ALLERGENS,
  ALLERGEN_COUNT,
  allergenStatus,
  introducedCount,
} from "./allergens";
import { daysSince, isoDate, fromIso, relativeDay } from "./date";

/**
 * Pure analytics for the Insights dashboard. No React, no store — everything
 * is derived from a LogEntry[] so each number is testable and explainable.
 */

export type Scope = "both" | BabyId;
export type GroupKey = FoodCategory | "allergens";
export type InsightTone = "neutral" | "sage" | "amber" | "alert";

export interface GroupScore {
  key: GroupKey;
  label: string;
  /** Distinct foods tried in this group (or allergens introduced). */
  tried: number;
  /** Denominator used for the base score. */
  target: number;
  /** 0..10, one decimal. */
  score: number;
  lastTs?: number;
  /** daysSince(lastTs), or undefined if never offered. */
  daysAgo?: number;
}

export interface Insight {
  id: string;
  text: string;
  tone: InsightTone;
  href?: string;
}

export interface WeekDelta {
  thisWeek: number;
  lastWeek: number;
  delta: number;
}

export interface WeekBar {
  label: string;
  count: number;
}

export interface TopFood {
  foodId: string;
  name: string;
  count: number;
  loved: number;
}

export interface DashboardData {
  groups: GroupScore[]; // 6 (5 categories + allergens), in ring order
  overall: number;
  variety: number;
  streak: number;
  daysLogged: number;
  acceptance: number; // 0..1
  week: WeekDelta;
  weekBars: WeekBar[];
  top: TopFood[];
  insights: Insight[];
  entryCount: number;
}

// ─── Tuning constants (kept transparent so the (i) popover can restate them) ──

/** Per-group "healthy variety" targets — below library size so a realistic
 *  rotation can reach 10. Library sizes: veg 12, fruit 8, grain 4, protein 10, dairy 2. */
export const GROUP_TARGET: Record<FoodCategory, number> = {
  vegetables: 8,
  fruits: 6,
  grains: 3,
  proteins: 6,
  dairy: 2,
};

/** Overall composite weights (sum = 1). */
export const GROUP_WEIGHT: Record<GroupKey, number> = {
  vegetables: 0.22,
  fruits: 0.16,
  grains: 0.12,
  proteins: 0.2,
  dairy: 0.1,
  allergens: 0.2,
};

export const RECENCY_BONUS_MAX = 1.5;
export const RECENCY_FULL_DAYS = 3;
export const RECENCY_ZERO_DAYS = 14;
export const STALE_GROUP_DAYS = 7;

export const CATEGORY_ACCENT: Record<GroupKey, string> = {
  vegetables: "var(--color-cat-veg)",
  fruits: "var(--color-cat-fruit)",
  grains: "var(--color-cat-grain)",
  proteins: "var(--color-cat-protein)",
  dairy: "var(--color-cat-dairy)",
  allergens: "var(--color-cat-allergen)",
};

/** How many foods exist in the library per group (for "7 of 12 tried"). */
export const LIB_COUNT: Record<GroupKey, number> = {
  vegetables: FOODS.filter((f) => f.category === "vegetables").length,
  fruits: FOODS.filter((f) => f.category === "fruits").length,
  grains: FOODS.filter((f) => f.category === "grains").length,
  proteins: FOODS.filter((f) => f.category === "proteins").length,
  dairy: FOODS.filter((f) => f.category === "dairy").length,
  allergens: ALLERGEN_COUNT,
};

// ─── Small helpers ───────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Fresh points for recency, gated by the caller on tried > 0. */
export function recencyBonus(daysAgo: number | undefined): number {
  if (daysAgo === undefined) return 0;
  if (daysAgo <= RECENCY_FULL_DAYS) return RECENCY_BONUS_MAX;
  if (daysAgo >= RECENCY_ZERO_DAYS) return 0;
  return (
    (RECENCY_BONUS_MAX * (RECENCY_ZERO_DAYS - daysAgo)) /
    (RECENCY_ZERO_DAYS - RECENCY_FULL_DAYS)
  );
}

/**
 * Defines the "Both" combination rule: the union entry stream. Variety metrics
 * de-dup with a Set<foodId> (→ union of distinct foods); activity metrics
 * (streak, days, acceptance) aggregate both twins' entries by design.
 */
export function scopeEntries(all: LogEntry[], scope: Scope): LogEntry[] {
  if (scope === "both") return all;
  return all.filter((e) => e.babyId === scope);
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export function foodGroupScores(entries: LogEntry[]): GroupScore[] {
  const distinct = new Map<FoodCategory, Set<string>>();
  const lastTs = new Map<FoodCategory, number>();

  for (const e of entries) {
    const f = getFood(e.foodId);
    if (!f) continue;
    const cat = f.category;
    if (!distinct.has(cat)) distinct.set(cat, new Set());
    distinct.get(cat)!.add(e.foodId);
    if (e.ts > (lastTs.get(cat) ?? -Infinity)) lastTs.set(cat, e.ts);
  }

  return CATEGORY_ORDER.map((cat) => {
    const tried = distinct.get(cat)?.size ?? 0;
    const target = GROUP_TARGET[cat];
    const last = lastTs.get(cat);
    const daysAgo = last === undefined ? undefined : daysSince(last);
    const base = Math.min(1, tried / target) * (10 - RECENCY_BONUS_MAX);
    const bonus = tried === 0 ? 0 : recencyBonus(daysAgo);
    return {
      key: cat,
      label: CATEGORY_LABEL[cat],
      tried,
      target,
      score: clamp(round1(base + bonus), 0, 10),
      lastTs: last,
      daysAgo,
    };
  });
}

export function allergenGroupScore(
  entries: LogEntry[],
  scope: Scope,
): GroupScore {
  let introduced = 0;
  if (scope === "both") {
    for (const a of ALLERGENS) {
      const byAutumn = allergenStatus(entries, a.foodIds, "autumn").introduced;
      const byAlma = allergenStatus(entries, a.foodIds, "alma").introduced;
      if (byAutumn || byAlma) introduced++;
    }
  } else {
    introduced = introducedCount(entries, scope);
  }

  const allergenFoodIds = new Set(ALLERGENS.flatMap((a) => a.foodIds));
  let last: number | undefined;
  for (const e of entries) {
    if (allergenFoodIds.has(e.foodId) && (last === undefined || e.ts > last)) {
      last = e.ts;
    }
  }
  const daysAgo = last === undefined ? undefined : daysSince(last);
  const base = Math.min(1, introduced / ALLERGEN_COUNT) * (10 - RECENCY_BONUS_MAX);
  const bonus = introduced === 0 ? 0 : recencyBonus(daysAgo);

  return {
    key: "allergens",
    label: "Allergens",
    tried: introduced,
    target: ALLERGEN_COUNT,
    score: clamp(round1(base + bonus), 0, 10),
    lastTs: last,
    daysAgo,
  };
}

export function overallScore(groups: GroupScore[], acceptance: number): number {
  if (groups.length === 0) return 0;
  let weighted = 0;
  for (const g of groups) weighted += g.score * (GROUP_WEIGHT[g.key] ?? 0);
  const acc = Number.isFinite(acceptance) ? acceptance : 0;
  return clamp(round1(0.9 * weighted + 0.1 * (acc * 10)), 0, 10);
}

export function varietyCount(entries: LogEntry[]): number {
  const set = new Set<string>();
  for (const e of entries) if (getFood(e.foodId)) set.add(e.foodId);
  return set.size;
}

export function loggingStreak(
  entries: LogEntry[],
  todayIso: string = isoDate(),
): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => e.date));
  const yesterdayIso = isoDate(addDays(fromIso(todayIso), -1));

  let cursor: string;
  if (days.has(todayIso)) cursor = todayIso;
  else if (days.has(yesterdayIso)) cursor = yesterdayIso;
  else return 0;

  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = isoDate(addDays(fromIso(cursor), -1));
  }
  return count;
}

export function daysLogged(entries: LogEntry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}

export function acceptanceRate(entries: LogEntry[]): number {
  if (entries.length === 0) return 0;
  const good = entries.filter(
    (e) => e.reaction === "loved" || e.reaction === "liked",
  ).length;
  return good / entries.length;
}

/** First time (min ts) each library food was logged within scope. */
function firstTsByFood(entries: LogEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) {
    if (!getFood(e.foodId)) continue;
    const prev = m.get(e.foodId);
    if (prev === undefined || e.ts < prev) m.set(e.foodId, e.ts);
  }
  return m;
}

export function newFoodsThisWeek(entries: LogEntry[]): WeekDelta {
  const first = firstTsByFood(entries);
  let thisWeek = 0;
  let lastWeek = 0;
  for (const ts of first.values()) {
    const d = daysSince(ts);
    if (d <= 6) thisWeek++;
    else if (d <= 13) lastWeek++;
  }
  return { thisWeek, lastWeek, delta: thisWeek - lastWeek };
}

export function newFoodsByWeek(entries: LogEntry[], weeks = 6): WeekBar[] {
  const first = firstTsByFood(entries);
  const buckets = new Array(weeks).fill(0);
  for (const ts of first.values()) {
    const w = Math.floor(daysSince(ts) / 7);
    if (w >= 0 && w < weeks) buckets[w]++;
  }
  const labelFor = (w: number) => (w === 0 ? "This" : w === 1 ? "Last" : `${w}w`);
  const bars: WeekBar[] = [];
  for (let w = weeks - 1; w >= 0; w--) bars.push({ label: labelFor(w), count: buckets[w] });
  return bars;
}

export function topFoods(entries: LogEntry[], limit = 3): TopFood[] {
  const agg = new Map<string, { name: string; count: number; loved: number }>();
  for (const e of entries) {
    const cur =
      agg.get(e.foodId) ??
      { name: getFood(e.foodId)?.name ?? e.foodName, count: 0, loved: 0 };
    cur.count++;
    if (e.reaction === "loved") cur.loved++;
    agg.set(e.foodId, cur);
  }
  return [...agg.entries()]
    .map(([foodId, v]) => ({ foodId, name: v.name, count: v.count, loved: v.loved }))
    .sort(
      (a, b) => b.loved - a.loved || b.count - a.count || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

export function scoreLabel(overall: number): string {
  if (overall >= 8) return "Thriving variety";
  if (overall >= 6) return "Good variety";
  if (overall >= 4) return "Getting there";
  if (overall >= 2) return "Early days";
  return "Just starting";
}

// ─── Insight generation (deterministic, ranked) ──────────────────────────────

function subjectLabel(scope: Scope): string {
  if (scope === "both") return "The girls";
  return BABIES.find((b) => b.id === scope)?.name ?? scope;
}
function possessiveLabel(scope: Scope): string {
  if (scope === "both") return "Their";
  return `${BABIES.find((b) => b.id === scope)?.name ?? scope}'s`;
}
const auxHasHave = (scope: Scope) => (scope === "both" ? "haven't" : "hasn't");

export function generateInsights(
  entries: LogEntry[],
  scope: Scope,
  groups: GroupScore[],
): Insight[] {
  if (entries.length === 0) {
    return [
      {
        id: "start",
        text: "Every food you log builds their story. Start with a simple vegetable.",
        tone: "neutral",
        href: "/foods",
      },
    ];
  }

  const who = subjectLabel(scope);
  const candidates: (Insight & { rank: number })[] = [];

  // Safety: a flagged reaction outranks everything actionable.
  const flagged = entries
    .filter((e) => e.flagged)
    .sort((a, b) => b.ts - a.ts)[0];
  if (flagged) {
    candidates.push({
      id: "flagged",
      text: `A reaction was noted on ${flagged.foodName} ${relativeDay(flagged.ts)}. Worth keeping an eye on.`,
      tone: "alert",
      href: "/journal",
      rank: 100,
    });
  }

  // Stale (or missing) vegetables.
  const veg = groups.find((g) => g.key === "vegetables");
  if (veg && (veg.tried === 0 || (veg.daysAgo ?? 0) >= STALE_GROUP_DAYS)) {
    candidates.push({
      id: "veg",
      text:
        veg.tried === 0
          ? `${who} ${auxHasHave(scope)} tried a vegetable yet — a gentle place to begin.`
          : `${who} ${auxHasHave(scope)} had a vegetable in ${veg.daysAgo} days.`,
      tone: "amber",
      href: "/foods",
      rank: 50 + (veg.daysAgo ?? 30),
    });
  }

  // Weakest food group (excluding allergens) that is genuinely low.
  const weakest = groups
    .filter((g) => g.key !== "allergens")
    .sort((a, b) => a.score - b.score)[0];
  if (weakest && weakest.score < 5) {
    candidates.push({
      id: "weak",
      text: `${possessiveLabel(scope)} ${weakest.label.toLowerCase()} could use some variety — ${weakest.tried} of ${LIB_COUNT[weakest.key]} tried.`,
      tone: "neutral",
      href: "/foods",
      rank: 40 + (5 - weakest.score) * 4,
    });
  }

  // Allergen momentum.
  const allergens = groups.find((g) => g.key === "allergens");
  if (allergens && allergens.tried > 0 && allergens.tried < ALLERGEN_COUNT) {
    const remaining = ALLERGEN_COUNT - allergens.tried;
    candidates.push({
      id: "allergen",
      text: `${remaining} allergen${remaining === 1 ? "" : "s"} still to introduce. Keep them in the weekly rotation.`,
      tone: "sage",
      href: "/journal",
      rank: 30 + remaining,
    });
  }

  // Positive streak.
  const streak = loggingStreak(entries);
  if (streak >= 3) {
    candidates.push({
      id: "streak",
      text: `${streak}-day logging streak — lovely consistency.`,
      tone: "sage",
      rank: 20 + streak,
    });
  }

  // Always have at least one calm line.
  candidates.push({
    id: "steady",
    text: `${varietyCount(entries)} foods explored so far. Keep the gentle pace.`,
    tone: "neutral",
    rank: 5,
  });

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.rank - a.rank)
    .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
    .slice(0, 2)
    .map(({ rank, ...rest }) => rest);
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export function buildDashboard(all: LogEntry[], scope: Scope): DashboardData {
  const e = scopeEntries(all, scope);
  const groups = [...foodGroupScores(e), allergenGroupScore(e, scope)];
  const acceptance = acceptanceRate(e);

  return {
    groups,
    overall: overallScore(groups, acceptance),
    variety: varietyCount(e),
    streak: loggingStreak(e),
    daysLogged: daysLogged(e),
    acceptance,
    week: newFoodsThisWeek(e),
    weekBars: newFoodsByWeek(e),
    top: topFoods(e),
    insights: generateInsights(e, scope, groups),
    entryCount: e.length,
  };
}
