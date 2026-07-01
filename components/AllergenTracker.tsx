"use client";

import { useStore } from "@/lib/store";
import { useLogSheet } from "./LogSheet";
import {
  Allergen,
  ALLERGENS,
  ALLERGEN_COUNT,
  AllergenStatus,
  allergenStatus,
  introducedCount,
  primaryFoodId,
} from "@/lib/allergens";
import { Baby, BabyId, LogEntry } from "@/lib/types";
import { useProfiles } from "@/lib/profiles";
import { daysSince, relativeDay } from "@/lib/date";
import { Card } from "./common";
import { AlertIcon, CheckIcon, PlusIcon, ShieldIcon } from "./icons";

type BabyFilter = "all" | BabyId;

const OFFER_AGAIN_DAYS = 7;

export function AllergenTracker({ filter }: { filter: BabyFilter }) {
  const { entries, ready } = useStore();
  const allProfiles = useProfiles();
  const babies =
    filter === "all" ? allProfiles : allProfiles.filter((b) => b.id === filter);

  if (!ready) return null;

  return (
    <div className="animate-soft-in">
      {/* Guidance */}
      <Card className="mb-5 flex gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-tint text-sage">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Introduce the big allergens early, one at a time, then keep each in
          the weekly rotation. Tap{" "}
          <span className="font-medium text-ink">Log</span> to record an
          offering — and flag a reaction if you notice one.
        </p>
      </Card>

      {/* Per-baby summary */}
      <div
        className={`mb-5 grid gap-3 ${
          babies.length === 2 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {babies.map((b) => {
          const n = introducedCount(entries, b.id);
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: b.colorVar }}
                />
                <span className="text-[14px] font-medium text-ink">
                  {b.name}
                </span>
              </div>
              <div className="mt-2 font-serif text-[1.7rem] leading-none text-ink">
                {n}
                <span className="text-[1rem] text-ink-faint">
                  {" "}
                  / {ALLERGEN_COUNT}
                </span>
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-soft">
                introduced
              </div>
              <ProgressBar value={n} total={ALLERGEN_COUNT} />
            </Card>
          );
        })}
      </div>

      {/* Allergen list */}
      <div className="space-y-2.5">
        {ALLERGENS.map((a) => (
          <AllergenCard
            key={a.id}
            allergen={a}
            filter={filter}
            babies={babies}
            entries={entries}
          />
        ))}
      </div>

      <p className="mt-6 px-1 text-center text-[11.5px] leading-relaxed text-ink-faint">
        General guidance only, not medical advice. Talk to your pediatrician
        about your family's allergy history.
      </p>
    </div>
  );
}

function AllergenCard({
  allergen,
  filter,
  babies,
  entries,
}: {
  allergen: Allergen;
  filter: BabyFilter;
  babies: Baby[];
  entries: LogEntry[];
}) {
  const { openLog } = useLogSheet();
  const statuses = babies.map((b) => ({
    baby: b,
    status: allergenStatus(entries, allergen.foodIds, b.id),
  }));
  const anyFlagged = statuses.some((s) => s.status.flagged);

  return (
    <Card className={`p-4 ${anyFlagged ? "border-alert-soft" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[1.15rem] leading-tight text-ink">
            {allergen.name}
          </h3>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-faint">
            {allergen.hint}
          </p>
        </div>
        <button
          onClick={() =>
            openLog({
              foodId: primaryFoodId(allergen),
              babyId: filter === "all" ? undefined : filter,
            })
          }
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors active:bg-paper-sunk"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Log
        </button>
      </div>

      <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
        {statuses.map(({ baby, status }) => (
          <BabyAllergenRow
            key={baby.id}
            baby={baby}
            status={status}
            showName={babies.length > 1}
          />
        ))}
      </div>
    </Card>
  );
}

function BabyAllergenRow({
  baby,
  status,
  showName,
}: {
  baby: Baby;
  status: AllergenStatus;
  showName: boolean;
}) {
  const stale =
    status.introduced &&
    !status.flagged &&
    status.lastTs !== undefined &&
    daysSince(status.lastTs) >= OFFER_AGAIN_DAYS;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {showName && (
          <span className="flex w-[64px] shrink-0 items-center gap-1.5 text-[13px] text-ink-soft">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: baby.colorVar }}
            />
            {baby.name}
          </span>
        )}
        {status.introduced ? (
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-sage" />
            <span className="shrink-0">Introduced</span>
            <span className="truncate text-ink-faint">
              · {status.count}× · {relativeDay(status.lastTs!)}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-faint">Not yet</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {status.flagged && (
          <span className="inline-flex items-center gap-1 rounded-full bg-alert-tint px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-alert">
            <AlertIcon className="h-2.5 w-2.5" />
            reaction
          </span>
        )}
        {stale && (
          <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[10.5px] font-medium text-amber">
            offer again
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
      <div
        className="h-full rounded-full bg-sage transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
