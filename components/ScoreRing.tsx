"use client";

export interface RingSegment {
  score: number; // 0..10
  color: string; // CSS colour
}

const R = 60;
const STROKE = 10;
const CENTER = 70;
const C = 2 * Math.PI * R;
const N = 6;
const GAP_DEG = 6;
const SEG_DEG = 360 / N - GAP_DEG; // 54°
const SEG_ARC = (C * SEG_DEG) / 360;
const GAP_ARC = (C * GAP_DEG) / 360;

export function ScoreRing({
  overall,
  label,
  segments,
  onInfo,
}: {
  overall: number;
  label: string;
  segments: RingSegment[];
  onInfo: () => void;
}) {
  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <svg
        viewBox="0 0 140 140"
        className="h-full w-full"
        role="img"
        aria-label={`Overall exploration score ${overall.toFixed(1)} out of 10`}
      >
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {segments.slice(0, N).map((seg, i) => {
            const offset = -(i * (SEG_ARC + GAP_ARC));
            const fillLen = SEG_ARC * Math.max(0, Math.min(1, seg.score / 10));
            return (
              <g key={i}>
                {/* faint full-arc track */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={R}
                  fill="none"
                  stroke="var(--color-paper-sunk)"
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  strokeDasharray={`${SEG_ARC} ${C - SEG_ARC}`}
                  strokeDashoffset={offset}
                />
                {/* colored fill proportional to score (omitted when zero) */}
                {fillLen > 0.5 && (
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${fillLen} ${C - fillLen}`}
                    strokeDashoffset={offset}
                    className="transition-[stroke-dasharray] duration-700"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Center overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif text-[3rem] leading-none text-ink tabular-nums">
          {overall.toFixed(1)}
        </span>
        <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
        <button
          onClick={onInfo}
          aria-label="How this score works"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-amber-soft"
        >
          exploration score
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-current text-[9px] font-semibold leading-none">
            i
          </span>
        </button>
      </div>
    </div>
  );
}
