import { BabyId, LogEntry } from "./types";

/** A row of the Supabase `entries` table. */
export interface EntryRow {
  id: string;
  household_id: string;
  date: string;
  ts: number;
  baby_id: string;
  food_id: string;
  food_name: string;
  reaction: string;
  amount: string;
  notes: string | null;
  flagged: boolean;
  deleted: boolean;
  updated_at: string;
  created_by: string | null;
}

export function rowToEntry(r: EntryRow): LogEntry {
  return {
    id: r.id,
    date: r.date,
    ts: Number(r.ts),
    babyId: r.baby_id as BabyId,
    foodId: r.food_id,
    foodName: r.food_name,
    reaction: r.reaction as LogEntry["reaction"],
    amount: r.amount as LogEntry["amount"],
    notes: r.notes ?? undefined,
    flagged: r.flagged || undefined,
  };
}

/** Build an upsert payload (server trigger sets updated_at). */
export function entryToRow(
  e: LogEntry,
  householdId: string,
  userId: string | null,
  deleted = false,
) {
  return {
    id: e.id,
    household_id: householdId,
    date: e.date,
    ts: e.ts,
    baby_id: e.babyId,
    food_id: e.foodId,
    food_name: e.foodName,
    reaction: e.reaction,
    amount: e.amount,
    notes: e.notes ?? null,
    flagged: e.flagged ?? false,
    deleted,
    created_by: userId,
  };
}

export interface ProfileRow {
  household_id: string;
  baby_id: string;
  name: string;
  color_var: string;
  birthday: string | null;
  updated_at: string;
}
