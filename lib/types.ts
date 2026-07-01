export type BabyId = "autumn" | "alma";

export interface Baby {
  id: BabyId;
  name: string;
  colorVar: string;
}

export const BABIES: Baby[] = [
  { id: "autumn", name: "Autumn", colorVar: "var(--color-autumn)" },
  { id: "alma", name: "Alma", colorVar: "var(--color-alma)" },
];

export type FoodCategory =
  | "vegetables"
  | "fruits"
  | "grains"
  | "proteins"
  | "dairy";

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  /** A common allergen worth introducing deliberately and watching. */
  allergen?: boolean;
  note?: string;
}

/** How the meal went — a calm five-point scale, no stars, no faces. */
export type Reaction = "loved" | "liked" | "neutral" | "unsure" | "refused";

export const REACTIONS: { id: Reaction; label: string }[] = [
  { id: "loved", label: "Loved it" },
  { id: "liked", label: "Liked it" },
  { id: "neutral", label: "Neutral" },
  { id: "unsure", label: "Unsure" },
  { id: "refused", label: "Refused" },
];

/** Roughly how much was eaten. */
export type Amount = "taste" | "some" | "lots";

export const AMOUNTS: { id: Amount; label: string }[] = [
  { id: "taste", label: "A taste" },
  { id: "some", label: "Some" },
  { id: "lots", label: "Lots" },
];

export interface LogEntry {
  id: string;
  /** ISO calendar date, yyyy-mm-dd, in local time. */
  date: string;
  /** Creation timestamp (ms) for ordering within a day. */
  ts: number;
  babyId: BabyId;
  foodId: string;
  foodName: string;
  reaction: Reaction;
  amount: Amount;
  notes?: string;
  /** An adverse/allergic reaction (rash, hives, swelling, tummy upset) was noted. */
  flagged?: boolean;
}
