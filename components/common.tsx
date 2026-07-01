import { BABIES, BabyId, Reaction } from "@/lib/types";

/** Monotonic "how well it went" scale, low → high. */
const REACTION_LEVEL: Record<Reaction, number> = {
  refused: 1,
  unsure: 2,
  neutral: 3,
  liked: 4,
  loved: 5,
};

const REACTION_LABEL: Record<Reaction, string> = {
  refused: "Refused",
  unsure: "Unsure",
  neutral: "Neutral",
  liked: "Liked it",
  loved: "Loved it",
};

export function reactionLabel(r: Reaction): string {
  return REACTION_LABEL[r];
}

/** A calm five-segment gauge — filled up to the reaction level. */
export function ReactionMeter({ reaction }: { reaction: Reaction }) {
  const level = REACTION_LEVEL[reaction];
  return (
    <div className="flex items-center gap-[3px]" aria-label={REACTION_LABEL[reaction]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full transition-colors"
          style={{
            background:
              i <= level ? "var(--color-amber)" : "var(--color-line)",
          }}
        />
      ))}
    </div>
  );
}

export function babyName(id: BabyId): string {
  return BABIES.find((b) => b.id === id)?.name ?? id;
}

export function babyColor(id: BabyId): string {
  return BABIES.find((b) => b.id === id)?.colorVar ?? "var(--color-amber)";
}

export function BabyDot({ id, className = "" }: { id: BabyId; className?: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`}
      style={{ background: babyColor(id) }}
    />
  );
}

/** A small pill with the baby's name and colour dot. */
export function BabyTag({ id }: { id: BabyId }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
      <BabyDot id={id} />
      {babyName(id)}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-line bg-paper-raised ${className}`}
    >
      {children}
    </div>
  );
}
