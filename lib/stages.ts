import { ageInMonths } from "./date";

/** Calm, non-medical weaning-stage guidance keyed to age in months. */
export interface Stage {
  key: string;
  minMonths: number;
  title: string;
  tip: string;
}

export const STAGES: Stage[] = [
  {
    key: "prep",
    minMonths: 0,
    title: "Getting ready",
    tip: "Most babies are ready for solids around 6 months — watch for sitting with support, steady head control, and interest in food.",
  },
  {
    key: "first",
    minMonths: 5,
    title: "First tastes",
    tip: "Start with single-ingredient purées and soft foods. Introduce the common allergens early, one at a time.",
  },
  {
    key: "textures",
    minMonths: 7,
    title: "More textures",
    tip: "Move toward mashed and lumpier textures, and widen the variety across all the food groups.",
  },
  {
    key: "finger",
    minMonths: 9,
    title: "Finger foods",
    tip: "Offer soft finger foods to practise self-feeding and the pincer grasp. Keep allergens in the weekly rotation.",
  },
  {
    key: "family",
    minMonths: 12,
    title: "Family meals",
    tip: "Most of what the family eats works now — chopped small, low salt and sugar. Keep offering variety.",
  },
];

export function stageFor(birthday: string): Stage {
  const m = ageInMonths(birthday);
  let stage = STAGES[0];
  for (const s of STAGES) if (m >= s.minMonths) stage = s;
  return stage;
}

export const STAGE_DISCLAIMER =
  "General guidance only, not medical advice — every baby is different. Check with your pediatrician.";
