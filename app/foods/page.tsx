"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useLogSheet } from "@/components/LogSheet";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  FOODS,
} from "@/lib/foods";
import { BABIES, BabyId, Food } from "@/lib/types";
import { Card } from "@/components/common";
import { PlusIcon } from "@/components/icons";

type Filter = "all" | "totry";

export default function FoodsPage() {
  const { entries, ready } = useStore();
  const { openLog } = useLogSheet();
  const [filter, setFilter] = useState<Filter>("all");

  // foodId -> set of babies who have tried it.
  const triedBy = useMemo(() => {
    const map = new Map<string, Set<BabyId>>();
    for (const e of entries) {
      if (!map.has(e.foodId)) map.set(e.foodId, new Set());
      map.get(e.foodId)!.add(e.babyId);
    }
    return map;
  }, [entries]);

  const introducedCount = useMemo(
    () => FOODS.filter((f) => triedBy.has(f.id)).length,
    [triedBy],
  );

  const perBabyCount = (id: BabyId) =>
    FOODS.filter((f) => triedBy.get(f.id)?.has(id)).length;

  return (
    <div className="animate-soft-in">
      <header className="mb-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          First foods
        </p>
        <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
          Introducing solids
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          A gentle checklist of first foods. Tap any to log a taste for Autumn,
          Alma, or both.
        </p>
      </header>

      {/* Progress */}
      <Card className="mb-5 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-serif text-[1.9rem] leading-none text-ink">
              {introducedCount}
              <span className="text-[1rem] text-ink-faint"> / {FOODS.length}</span>
            </div>
            <div className="mt-1 text-[13px] text-ink-soft">
              foods introduced
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            {BABIES.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-end gap-2 text-[12.5px] text-ink-soft"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: b.colorVar }}
                />
                {b.name}
                <span className="tabular-nums font-medium text-ink">
                  {perBabyCount(b.id)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ProgressBar value={introducedCount} total={FOODS.length} />
      </Card>

      {/* Filter */}
      <div className="mb-5 flex gap-2">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          All foods
        </FilterTab>
        <FilterTab
          active={filter === "totry"}
          onClick={() => setFilter("totry")}
        >
          Still to try
        </FilterTab>
      </div>

      {/* Categories */}
      {ready && (
        <div className="space-y-7">
          {CATEGORY_ORDER.map((cat) => {
            let items = FOODS.filter((f) => f.category === cat);
            if (filter === "totry") {
              items = items.filter((f) => !triedBy.has(f.id));
            }
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <div className="mb-2.5 flex items-baseline justify-between">
                  <h2 className="font-serif text-[1.2rem] text-ink">
                    {CATEGORY_LABEL[cat]}
                  </h2>
                  <span className="text-[12px] text-ink-faint">
                    {items.length}
                  </span>
                </div>
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised">
                  {items.map((f, i) => (
                    <FoodRow
                      key={f.id}
                      food={f}
                      tried={triedBy.get(f.id)}
                      first={i === 0}
                      onLog={() => openLog({ foodId: f.id })}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FoodRow({
  food,
  tried,
  first,
  onLog,
}: {
  food: Food;
  tried: Set<BabyId> | undefined;
  first: boolean;
  onLog: () => void;
}) {
  return (
    <button
      onClick={onLog}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-paper-sunk ${
        first ? "" : "border-t border-line-soft"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] text-ink">{food.name}</span>
          {food.allergen && (
            <span className="shrink-0 rounded-full bg-amber-tint px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-amber">
              allergen
            </span>
          )}
        </div>
        {food.note && (
          <p className="mt-0.5 truncate text-[12px] text-ink-faint">
            {food.note}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {BABIES.map((b) => (
          <StatusChip
            key={b.id}
            baby={b.id}
            done={!!tried?.has(b.id)}
          />
        ))}
      </div>

      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint">
        <PlusIcon className="h-4 w-4" />
      </span>
    </button>
  );
}

function StatusChip({ baby, done }: { baby: BabyId; done: boolean }) {
  const info = BABIES.find((b) => b.id === baby)!;
  const initials = info.name.slice(0, 2);
  return (
    <span
      title={`${info.name}${done ? " — introduced" : " — not yet"}`}
      className="grid h-7 w-7 place-items-center rounded-full border text-[10.5px] font-semibold transition-colors"
      style={{
        borderColor: done ? "transparent" : "var(--color-line)",
        background: done ? info.colorVar : "transparent",
        color: done ? "var(--color-paper-raised)" : "var(--color-ink-faint)",
      }}
    >
      {initials}
    </span>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
      <div
        className="h-full rounded-full bg-amber transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-all ${
        active
          ? "border-transparent bg-ink text-paper-raised"
          : "border-line bg-paper text-ink-soft hover:border-amber-soft"
      }`}
    >
      {children}
    </button>
  );
}
