import { BabyId, LogEntry } from "./types";

/**
 * The common food allergens worth introducing early, one at a time, and then
 * keeping in a regular rotation. Each maps to the library foods that introduce
 * it, so status can be derived from ordinary log entries.
 */
export interface Allergen {
  id: string;
  name: string;
  foodIds: string[];
  hint: string;
}

export const ALLERGENS: Allergen[] = [
  { id: "peanut", name: "Peanut", foodIds: ["peanut"], hint: "Smooth peanut butter, thinned." },
  { id: "egg", name: "Egg", foodIds: ["egg"], hint: "Well-cooked." },
  { id: "dairy", name: "Dairy", foodIds: ["yogurt", "cheese"], hint: "Full-fat yogurt or cheese." },
  { id: "sesame", name: "Sesame", foodIds: ["sesame"], hint: "Tahini, thinned." },
  { id: "wheat", name: "Wheat", foodIds: ["wheat"], hint: "Wheat cereal or pasta." },
  { id: "soy", name: "Soy", foodIds: ["tofu"], hint: "Tofu or soy yogurt." },
  {
    id: "tree-nut",
    name: "Tree nuts",
    foodIds: ["almond"],
    hint: "Smooth nut butter, thinned — never whole.",
  },
  { id: "fish", name: "Fish", foodIds: ["salmon"], hint: "Well-cooked, check for bones." },
  {
    id: "shellfish",
    name: "Shellfish",
    foodIds: ["shrimp"],
    hint: "Well-cooked, finely chopped.",
  },
];

export const ALLERGEN_COUNT = ALLERGENS.length;

/** The food to prefill when logging this allergen from the tracker. */
export function primaryFoodId(allergen: Allergen): string {
  return allergen.foodIds[0];
}

export interface AllergenStatus {
  introduced: boolean;
  /** Number of times offered. */
  count: number;
  firstTs?: number;
  lastTs?: number;
  /** Any adverse reaction was noted on an exposure. */
  flagged: boolean;
}

/** Derive one baby's status for an allergen from the full entry list. */
export function allergenStatus(
  entries: LogEntry[],
  foodIds: string[],
  babyId: BabyId,
): AllergenStatus {
  const set = new Set(foodIds);
  let count = 0;
  let firstTs = Infinity;
  let lastTs = -Infinity;
  let flagged = false;

  for (const e of entries) {
    if (e.babyId !== babyId || !set.has(e.foodId)) continue;
    count++;
    if (e.ts < firstTs) firstTs = e.ts;
    if (e.ts > lastTs) lastTs = e.ts;
    if (e.flagged) flagged = true;
  }

  if (count === 0) return { introduced: false, count: 0, flagged: false };
  return { introduced: true, count, firstTs, lastTs, flagged };
}

/** How many allergens this baby has been introduced to. */
export function introducedCount(entries: LogEntry[], babyId: BabyId): number {
  return ALLERGENS.reduce(
    (n, a) => n + (allergenStatus(entries, a.foodIds, babyId).introduced ? 1 : 0),
    0,
  );
}
