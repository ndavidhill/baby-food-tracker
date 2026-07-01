"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { dayLabel } from "@/lib/date";
import { BabyId, LogEntry } from "@/lib/types";
import { useProfiles } from "@/lib/profiles";
import { Card } from "@/components/common";
import { EntryRow } from "@/components/EntryRow";
import { AllergenTracker } from "@/components/AllergenTracker";
import { JournalIcon, ShieldIcon } from "@/components/icons";

type BabyFilter = "all" | BabyId;
type View = "timeline" | "allergens";

export default function JournalPage() {
  const { entries, ready, removeEntry } = useStore();
  const [filter, setFilter] = useState<BabyFilter>("all");
  const [view, setView] = useState<View>("timeline");

  const visible = useMemo(
    () =>
      entries
        .filter((e) => filter === "all" || e.babyId === filter)
        .sort((a, b) => b.ts - a.ts),
    [entries, filter],
  );

  // Group by calendar date, preserving newest-first order.
  const days = useMemo(() => {
    const groups: { date: string; items: LogEntry[] }[] = [];
    const index = new Map<string, LogEntry[]>();
    for (const e of visible) {
      if (!index.has(e.date)) {
        const arr: LogEntry[] = [];
        index.set(e.date, arr);
        groups.push({ date: e.date, items: arr });
      }
      index.get(e.date)!.push(e);
    }
    return groups;
  }, [visible]);

  return (
    <div className="animate-soft-in">
      <header className="mb-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          Journal
        </p>
        <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
          Their days, remembered
        </h1>
      </header>

      {/* View switch */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border border-line bg-paper p-1">
        <SegTab
          active={view === "timeline"}
          onClick={() => setView("timeline")}
          Icon={JournalIcon}
        >
          Timeline
        </SegTab>
        <SegTab
          active={view === "allergens"}
          onClick={() => setView("allergens")}
          Icon={ShieldIcon}
        >
          Allergens
        </SegTab>
      </div>

      {/* Baby filter */}
      <div className="mb-6 flex gap-2">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          Both
        </FilterTab>
        {useProfiles().map((b) => (
          <FilterTab
            key={b.id}
            active={filter === b.id}
            onClick={() => setFilter(b.id)}
            color={b.colorVar}
          >
            {b.name}
          </FilterTab>
        ))}
      </div>

      {view === "allergens" ? (
        <AllergenTracker filter={filter} />
      ) : (
        <>
          {ready && days.length === 0 && <EmptyJournal />}

          <div className="space-y-7">
            {days.map(({ date, items }) => (
              <section key={date}>
                <div className="mb-2.5 flex items-center gap-3">
                  <h2 className="font-serif text-[1.15rem] text-ink">
                    {dayLabel(date)}
                  </h2>
                  <div className="h-px flex-1 bg-line-soft" />
                  <span className="text-[12px] text-ink-faint">
                    {items.length} {items.length === 1 ? "food" : "foods"}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {items.map((e) => (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      onRemove={removeEntry}
                      showBaby={filter === "all"}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SegTab({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-[13.5px] font-medium transition-colors ${
        active ? "bg-ink text-paper-raised" : "text-ink-soft"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function EmptyJournal() {
  return (
    <Card className="px-5 py-12 text-center">
      <div className="mx-auto mb-3 h-px w-10 bg-line" />
      <p className="font-serif text-[1.05rem] text-ink">Nothing here yet</p>
      <p className="mx-auto mt-1.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-soft">
        Every food you log will gather here, day by day — a quiet record of how
        Autumn and Alma are growing into solids.
      </p>
    </Card>
  );
}

function FilterTab({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-all ${
        active
          ? "border-transparent bg-ink text-paper-raised"
          : "border-line bg-paper text-ink-soft hover:border-amber-soft"
      }`}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: active ? color : "var(--color-line)" }}
        />
      )}
      {children}
    </button>
  );
}
