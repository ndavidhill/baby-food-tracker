"use client";

import { LogEntry } from "@/lib/types";
import { getFood } from "@/lib/foods";
import { timeLabel } from "@/lib/date";
import {
  BabyDot,
  Card,
  ReactionMeter,
  babyName,
  reactionLabel,
} from "./common";
import { AlertIcon, TrashIcon } from "./icons";

export function EntryRow({
  entry,
  onRemove,
  showBaby = true,
}: {
  entry: LogEntry;
  onRemove: (id: string) => void;
  showBaby?: boolean;
}) {
  const allergen = getFood(entry.foodId)?.allergen;
  return (
    <li className="group animate-rise">
      <Card
        className={`flex items-center gap-3 p-3.5 ${
          entry.flagged ? "border-alert-soft" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[15px] font-medium text-ink">
              {entry.foodName}
            </span>
            {allergen && (
              <span className="shrink-0 rounded-full bg-amber-tint px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-amber">
                allergen
              </span>
            )}
            {entry.flagged && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-alert-tint px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-alert">
                <AlertIcon className="h-2.5 w-2.5" />
                reaction
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-faint">
            {showBaby && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <BabyDot id={entry.babyId} />
                  {babyName(entry.babyId)}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{reactionLabel(entry.reaction)}</span>
            <span aria-hidden>·</span>
            <span>{timeLabel(entry.ts)}</span>
          </div>
          {entry.notes && (
            <p className="mt-1.5 text-[13px] italic leading-snug text-ink-soft">
              {entry.notes}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ReactionMeter reaction={entry.reaction} />
          <button
            onClick={() => onRemove(entry.id)}
            aria-label="Delete entry"
            className="text-ink-faint opacity-0 transition-opacity hover:text-amber group-hover:opacity-100 max-sm:opacity-60"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </li>
  );
}
