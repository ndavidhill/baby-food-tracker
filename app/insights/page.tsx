"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  buildDashboard,
  CATEGORY_ACCENT,
  GroupKey,
  Insight,
  InsightTone,
  LIB_COUNT,
  Scope,
  scoreLabel,
} from "@/lib/insights";
import { BABIES } from "@/lib/types";
import { relativeDay } from "@/lib/date";
import {
  Card,
  FilterTab,
  ProgressBar,
  ReactionMeter,
} from "@/components/common";
import { ScoreRing } from "@/components/ScoreRing";
import {
  AlertIcon,
  AppleIcon,
  ChevronRightIcon,
  DropIcon,
  EggIcon,
  LeafIcon,
  ShieldIcon,
  SparkIcon,
  SproutIcon,
  WheatIcon,
} from "@/components/icons";

type IconCmp = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const GROUP_ICON: Record<GroupKey, IconCmp> = {
  vegetables: SproutIcon,
  fruits: AppleIcon,
  grains: WheatIcon,
  proteins: EggIcon,
  dairy: DropIcon,
  allergens: ShieldIcon,
};

const TONE: Record<
  InsightTone,
  { wrap: string; badge: string; iconColor: string; Icon: IconCmp }
> = {
  neutral: {
    wrap: "border-line bg-paper-raised",
    badge: "bg-paper-sunk",
    iconColor: "text-ink-soft",
    Icon: SparkIcon,
  },
  sage: {
    wrap: "border-sage-tint bg-sage-tint/50",
    badge: "bg-paper-raised",
    iconColor: "text-sage",
    Icon: ShieldIcon,
  },
  amber: {
    wrap: "border-amber-soft bg-amber-tint/60",
    badge: "bg-paper-raised",
    iconColor: "text-amber",
    Icon: LeafIcon,
  },
  alert: {
    wrap: "border-alert-soft bg-alert-tint/70",
    badge: "bg-paper-raised",
    iconColor: "text-alert",
    Icon: AlertIcon,
  },
};

export default function InsightsPage() {
  const { entries, ready } = useStore();
  const [scope, setScope] = useState<Scope>("both");
  const [showInfo, setShowInfo] = useState(false);

  const data = useMemo(() => buildDashboard(entries, scope), [entries, scope]);

  if (!ready) return null;

  const empty = data.entryCount === 0;
  const who = scope === "both" ? "the girls" : BABIES.find((b) => b.id === scope)?.name;
  const d = data.week.delta;
  const weekSub =
    d > 0
      ? `▲ ${d} vs last week`
      : d < 0
        ? `▼ ${Math.abs(d)} vs last week`
        : "same as last week";

  return (
    <div className="animate-soft-in">
      <header className="mb-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          Insights
        </p>
        <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
          How they&apos;re eating
        </h1>
      </header>

      {/* Scope selector */}
      <div className="mb-6 flex gap-2">
        <FilterTab active={scope === "both"} onClick={() => setScope("both")}>
          Both
        </FilterTab>
        {BABIES.map((b) => (
          <FilterTab
            key={b.id}
            active={scope === b.id}
            onClick={() => setScope(b.id)}
            color={b.colorVar}
          >
            {b.name}
          </FilterTab>
        ))}
      </div>

      {/* Hero score ring */}
      <Card className="mb-5 p-6">
        <ScoreRing
          overall={data.overall}
          label={scoreLabel(data.overall)}
          segments={data.groups.map((g) => ({
            score: g.score,
            color: CATEGORY_ACCENT[g.key],
          }))}
          onInfo={() => setShowInfo((v) => !v)}
        />
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {data.groups.map((g) => (
            <span
              key={g.key}
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: CATEGORY_ACCENT[g.key] }}
              />
              {g.label}
            </span>
          ))}
        </div>
        {showInfo && (
          <div className="mt-4 rounded-2xl border border-line-soft bg-paper px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft animate-rise">
            A blend of how much <span className="text-ink">variety</span> {who}{" "}
            have across six food groups, how <span className="text-ink">fresh</span>{" "}
            each group is, and how often foods are{" "}
            <span className="text-ink">enjoyed</span>. A gentle guide to exploring
            solids — not a medical measure.
          </div>
        )}
      </Card>

      {empty ? (
        <EmptyInsights />
      ) : (
        <>
          {/* Insight cards */}
          {data.insights.length > 0 && (
            <div className="mb-5 space-y-2.5">
              {data.insights.map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </div>
          )}

          {/* Food groups */}
          <section className="mb-5">
            <h2 className="mb-3 font-serif text-[1.3rem] text-ink">Food groups</h2>
            <Card className="overflow-hidden">
              {data.groups.map((g, i) => {
                const Icon = GROUP_ICON[g.key];
                const accent = CATEGORY_ACCENT[g.key];
                return (
                  <div
                    key={g.key}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i === 0 ? "" : "border-t border-line-soft"
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-sunk">
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-medium text-ink">
                          {g.label}
                        </span>
                        <span className="font-serif text-[15px] tabular-nums text-ink">
                          {g.score.toFixed(1)}
                          <span className="text-[11px] text-ink-faint">/10</span>
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={g.score} total={10} color={accent} />
                      </div>
                      <div className="mt-1.5 text-[12px] text-ink-faint">
                        {g.tried} of {LIB_COUNT[g.key]} tried
                        {g.daysAgo === undefined
                          ? " · none yet"
                          : ` · last ${relativeDay(g.lastTs!)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          {/* Stat grid */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <StatCard value={data.variety} label="foods tried" />
            <StatCard
              value={data.week.thisWeek}
              label="new this week"
              sub={weekSub}
            />
            <StatCard value={data.streak} label="day logging streak" />
            <StatCard
              value={`${Math.round(data.acceptance * 100)}%`}
              label="loved or liked"
            />
          </div>

          {/* Most loved */}
          {data.top[0] && (
            <Card className="mb-5 flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                  Most loved
                </div>
                <div className="mt-1 truncate font-serif text-[1.4rem] text-ink">
                  {data.top[0].name}
                </div>
                <div className="text-[12.5px] text-ink-soft">
                  offered {data.top[0].count}× · loved {data.top[0].loved}×
                </div>
              </div>
              <ReactionMeter reaction="loved" />
            </Card>
          )}

          {/* Weekly trend */}
          <Card className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-serif text-[1.15rem] text-ink">
                New foods by week
              </h3>
              <span className="text-[12px] text-ink-faint">{weekSub}</span>
            </div>
            <TrendBars bars={data.weekBars} />
          </Card>
        </>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const t = TONE[insight.tone];
  const { Icon } = t;
  const inner = (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-card)] border px-4 py-3.5 ${t.wrap}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${t.badge} ${t.iconColor}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink">
        {insight.text}
      </p>
      {insight.href && (
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
      )}
    </div>
  );
  return insight.href ? <Link href={insight.href}>{inner}</Link> : inner;
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="font-serif text-[1.9rem] leading-none tabular-nums text-ink">
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] text-ink-soft">{label}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-ink-faint">{sub}</div>}
    </Card>
  );
}

function TrendBars({ bars }: { bars: { label: string; count: number }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div>
      <div className="flex h-24 items-end gap-2">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[11px] tabular-nums text-ink-faint">
              {b.count > 0 ? b.count : ""}
            </span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(b.count / max) * 100}%`,
                minHeight: b.count > 0 ? "6px" : "2px",
                background:
                  b.count > 0
                    ? "var(--color-cat-grain)"
                    : "var(--color-paper-sunk)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {bars.map((b, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[10px] text-ink-faint"
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyInsights() {
  return (
    <Card className="px-5 py-10 text-center">
      <div className="mx-auto mb-3 h-px w-10 bg-line" />
      <p className="font-serif text-[1.05rem] text-ink">
        Insights are on their way
      </p>
      <p className="mx-auto mt-1.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-soft">
        Once you&apos;ve logged a few foods, this is where their variety,
        favourites, and gentle nudges will take shape.
      </p>
    </Card>
  );
}
