"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useLogSheet } from "@/components/LogSheet";
import { useProfiles } from "@/lib/profiles";
import { isoDate, greeting, ageLabel } from "@/lib/date";
import { stageFor } from "@/lib/stages";
import { FOODS } from "@/lib/foods";
import { BabyId } from "@/lib/types";
import { BabyDot, Card } from "@/components/common";
import { EntryRow } from "@/components/EntryRow";
import { PlusIcon, SettingsIcon, SparkIcon } from "@/components/icons";

export default function TodayPage() {
  const { entries, ready, removeEntry } = useStore();
  const { openLog } = useLogSheet();
  const profiles = useProfiles();
  const title = profiles.map((p) => p.name).join(" & ");
  const withBirthday = profiles.find((p) => p.birthday);
  const stage = withBirthday?.birthday ? stageFor(withBirthday.birthday) : null;
  const today = isoDate();

  const todayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.date === today)
        .sort((a, b) => b.ts - a.ts),
    [entries, today],
  );

  const triedIds = useMemo(
    () => new Set(entries.map((e) => e.foodId)),
    [entries],
  );

  // A gentle suggestion: the first library food nobody has tried yet.
  const suggestion = useMemo(
    () => FOODS.find((f) => !triedIds.has(f.id)),
    [triedIds],
  );

  const countFor = (id: BabyId) =>
    todayEntries.filter((e) => e.babyId === id).length;

  return (
    <div className="animate-soft-in">
      <header className="mb-7 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
            {greeting()}
          </p>
          <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
            {title}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {stage && (
            <p className="mt-1 text-[13px] text-ink-faint">{stage.title}</p>
          )}
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:bg-paper-sunk"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      {/* Today at a glance */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {profiles.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-center gap-2">
              <BabyDot id={b.id} />
              <span className="text-[14px] font-medium text-ink">
                {b.name}
              </span>
            </div>
            {b.birthday && (
              <div className="mt-0.5 text-[12px] text-ink-faint">
                {ageLabel(b.birthday)}
              </div>
            )}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-serif text-[2rem] leading-none text-ink">
                {countFor(b.id)}
              </span>
              <span className="text-[13px] text-ink-faint">
                {countFor(b.id) === 1 ? "food today" : "foods today"}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Primary action */}
      <button
        onClick={() => openLog()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-ink py-4 text-[15px] font-medium text-paper-raised shadow-[0_8px_24px_-12px_rgba(51,48,42,0.8)] transition-transform active:scale-[0.99]"
      >
        <PlusIcon className="h-5 w-5" />
        Log a food
      </button>

      {/* Suggestion */}
      {suggestion && (
        <button
          onClick={() => openLog({ foodId: suggestion.id })}
          className="mb-7 flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-amber-soft bg-amber-tint/60 px-4 py-3.5 text-left transition-colors active:bg-amber-tint"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-raised text-amber">
            <SparkIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium uppercase tracking-[0.12em] text-amber">
              Something new
            </span>
            <span className="block truncate text-[15px] text-ink">
              Try {suggestion.name.toLowerCase()} with the girls
            </span>
          </span>
        </button>
      )}

      {/* Today's log */}
      <section>
        <h2 className="mb-3 font-serif text-[1.3rem] text-ink">Today</h2>
        {!ready ? null : todayEntries.length === 0 ? (
          <EmptyToday />
        ) : (
          <ul className="space-y-2.5">
            {todayEntries.map((e) => (
              <EntryRow key={e.id} entry={e} onRemove={removeEntry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyToday() {
  return (
    <Card className="px-5 py-10 text-center">
      <div className="mx-auto mb-3 h-px w-10 bg-line" />
      <p className="font-serif text-[1.05rem] text-ink">A fresh day</p>
      <p className="mx-auto mt-1.5 max-w-[15rem] text-[13.5px] leading-relaxed text-ink-soft">
        Nothing logged yet. When Autumn or Alma tries a food, tap{" "}
        <span className="font-medium text-ink">Log a food</span> to remember it.
      </p>
    </Card>
  );
}
