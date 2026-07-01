"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Amount,
  AMOUNTS,
  BabyId,
  Reaction,
  REACTIONS,
} from "@/lib/types";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  FOODS,
  getFood,
} from "@/lib/foods";
import { isoDate } from "@/lib/date";
import { useStore } from "@/lib/store";
import { useProfiles } from "@/lib/profiles";
import { AlertIcon, CheckIcon, CloseIcon, SearchIcon } from "./icons";

type BabyMode = BabyId | "both";

interface Prefill {
  foodId?: string;
  babyId?: BabyId;
  /** When set, the sheet edits this existing entry instead of creating one. */
  entryId?: string;
}

interface LogSheetValue {
  openLog: (prefill?: Prefill) => void;
}

const LogSheetContext = createContext<LogSheetValue | null>(null);

export function useLogSheet() {
  const ctx = useContext(LogSheetContext);
  if (!ctx) throw new Error("useLogSheet must be used within LogSheetProvider");
  return ctx;
}

export function LogSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({});

  const openLog = useCallback((p?: Prefill) => {
    setPrefill(p ?? {});
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openLog }), [openLog]);

  return (
    <LogSheetContext.Provider value={value}>
      {children}
      {open && (
        <LogSheet
          prefill={prefill}
          onClose={() => setOpen(false)}
        />
      )}
    </LogSheetContext.Provider>
  );
}

function LogSheet({
  prefill,
  onClose,
}: {
  prefill: Prefill;
  onClose: () => void;
}) {
  const { entries, addEntry, updateEntry, removeEntry } = useStore();
  const existing = prefill.entryId
    ? entries.find((e) => e.id === prefill.entryId)
    : undefined;
  const editing = !!existing;
  const profiles = useProfiles();
  const autumn = profiles.find((p) => p.id === "autumn")!;
  const alma = profiles.find((p) => p.id === "alma")!;
  const [babyMode, setBabyMode] = useState<BabyMode>(
    () => existing?.babyId ?? prefill.babyId ?? "both",
  );
  const [foodId, setFoodId] = useState<string | null>(() =>
    existing
      ? existing.foodId.startsWith("custom:")
        ? null
        : existing.foodId
      : prefill.foodId ?? null,
  );
  const [customFood, setCustomFood] = useState<string>(() =>
    existing && existing.foodId.startsWith("custom:") ? existing.foodName : "",
  );
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState<Amount>(() => existing?.amount ?? "some");
  const [reaction, setReaction] = useState<Reaction>(
    () => existing?.reaction ?? "liked",
  );
  const [notes, setNotes] = useState(() => existing?.notes ?? "");
  const [flagged, setFlagged] = useState(() => existing?.flagged ?? false);
  const [closing, setClosing] = useState(false);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const selectedFoodName = foodId
    ? getFood(foodId)?.name ?? ""
    : customFood.trim();

  const canSave = selectedFoodName.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS;
    return FOODS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOODS.some((f) => f.name.toLowerCase() === q);
  }, [query]);

  function handleSave() {
    if (!canSave) return;
    const fid = foodId ?? `custom:${selectedFoodName.toLowerCase()}`;
    if (editing && prefill.entryId) {
      updateEntry(prefill.entryId, {
        babyId: babyMode === "both" ? existing!.babyId : babyMode,
        foodId: fid,
        foodName: selectedFoodName,
        reaction,
        amount,
        notes: notes.trim() || undefined,
        flagged: flagged || undefined,
      });
      close();
      return;
    }
    const date = isoDate();
    const babies: BabyId[] =
      babyMode === "both" ? ["autumn", "alma"] : [babyMode];
    for (const babyId of babies) {
      addEntry({
        date,
        babyId,
        foodId: fid,
        foodName: selectedFoodName,
        reaction,
        amount,
        notes: notes.trim() || undefined,
        flagged: flagged || undefined,
      });
    }
    close();
  }

  function handleDelete() {
    if (prefill.entryId) removeEntry(prefill.entryId);
    close();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Scrim */}
      <button
        aria-label="Close"
        onClick={close}
        className={`absolute inset-0 bg-[#2a2620]/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Sheet */}
      <div
        className={`relative flex max-h-[92dvh] flex-col rounded-t-[28px] border-t border-line bg-paper-raised shadow-[0_-8px_40px_-12px_rgba(60,50,35,0.35)] ${
          closing ? "translate-y-full" : "animate-rise"
        } transition-transform duration-200`}
      >
        {/* Grip + header */}
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto h-1 w-9 rounded-full bg-line" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] text-ink">
              {editing ? "Edit food" : "Log a food"}
            </h2>
            <button
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-sunk"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
          {/* Who */}
          <Field label="Who">
            <div
              className={`grid gap-2 ${editing ? "grid-cols-2" : "grid-cols-3"}`}
            >
              <ModeButton
                active={babyMode === "autumn"}
                onClick={() => setBabyMode("autumn")}
                color={autumn.colorVar}
              >
                {autumn.name}
              </ModeButton>
              <ModeButton
                active={babyMode === "alma"}
                onClick={() => setBabyMode("alma")}
                color={alma.colorVar}
              >
                {alma.name}
              </ModeButton>
              {!editing && (
                <ModeButton
                  active={babyMode === "both"}
                  onClick={() => setBabyMode("both")}
                  color="var(--color-amber)"
                >
                  Both
                </ModeButton>
              )}
            </div>
          </Field>

          {/* Food */}
          <Field label="Food">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
              <input
                value={foodId ? getFood(foodId)?.name ?? "" : query}
                onChange={(e) => {
                  setFoodId(null);
                  setCustomFood("");
                  setQuery(e.target.value);
                }}
                onFocus={() => {
                  if (foodId) {
                    setFoodId(null);
                    setQuery("");
                  }
                }}
                placeholder="Search or type a food…"
                className="w-full rounded-2xl border border-line bg-paper py-3 pl-10 pr-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-amber-soft focus:bg-paper-raised"
              />
            </div>

            {!foodId && (
              <div className="mt-2.5 max-h-52 overflow-y-auto rounded-2xl border border-line-soft bg-paper/60">
                {query.trim() && !exactMatch && (
                  <button
                    onClick={() => {
                      setCustomFood(query.trim());
                      setFoodId(null);
                      setQuery(query.trim());
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] text-ink transition-colors hover:bg-amber-tint"
                  >
                    <span className="text-ink-soft">Add</span>
                    <span className="font-medium">“{query.trim()}”</span>
                  </button>
                )}
                {CATEGORY_ORDER.map((cat) => {
                  const items = filtered.filter((f) => f.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="sticky top-0 bg-paper-sunk/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint backdrop-blur">
                        {CATEGORY_LABEL[cat]}
                      </div>
                      {items.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setFoodId(f.id);
                            setCustomFood("");
                            setQuery("");
                          }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-amber-tint"
                        >
                          <span className="text-[15px] text-ink">{f.name}</span>
                          {f.allergen && (
                            <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber">
                              allergen
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
                {filtered.length === 0 && !query.trim() && (
                  <div className="px-4 py-6 text-center text-sm text-ink-faint">
                    No foods
                  </div>
                )}
              </div>
            )}

            {customFood && (
              <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                <CheckIcon className="h-4 w-4 text-amber" />
                Logging <span className="font-medium text-ink">{customFood}</span>
              </div>
            )}
          </Field>

          {/* Amount */}
          <Field label="How much">
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((a) => (
                <Pill
                  key={a.id}
                  active={amount === a.id}
                  onClick={() => setAmount(a.id)}
                >
                  {a.label}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Reaction */}
          <Field label="How did it go">
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map((r) => (
                <Pill
                  key={r.id}
                  active={reaction === r.id}
                  onClick={() => setReaction(r.id)}
                >
                  {r.label}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Reaction / allergy watch */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setFlagged((v) => !v)}
              aria-pressed={flagged}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                flagged
                  ? "border-transparent bg-alert-tint"
                  : "border-line bg-paper"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <AlertIcon
                  className={`h-[18px] w-[18px] ${
                    flagged ? "text-alert" : "text-ink-faint"
                  }`}
                />
                <span
                  className={`text-[15px] ${
                    flagged ? "font-medium text-alert" : "text-ink"
                  }`}
                >
                  Flag a reaction
                </span>
              </span>
              <Switch on={flagged} />
            </button>
            {flagged && (
              <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-ink-soft">
                Note the symptoms below — rash, hives, swelling, vomiting. If
                breathing is affected or symptoms are severe, seek medical help
                right away.
              </p>
            )}
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything to remember — a rash, a favourite, a mess…"
              className="w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-amber-soft focus:bg-paper-raised"
            />
          </Field>

          <div className="h-2" />
        </div>

        {/* Save bar */}
        <div className="shrink-0 border-t border-line-soft bg-paper-raised px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-medium text-paper-raised transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
          >
            {editing
              ? "Save changes"
              : babyMode === "both"
                ? "Save for both"
                : "Save"}
          </button>
          {editing && (
            <button
              onClick={handleDelete}
              className="mt-2 w-full rounded-2xl py-3 text-[14px] font-medium text-alert transition-colors active:bg-alert-tint"
            >
              Delete this entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[14px] font-medium transition-all ${
        active
          ? "border-transparent bg-ink text-paper-raised"
          : "border-line bg-paper text-ink-soft hover:border-amber-soft"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: active ? color : "var(--color-line)" }}
      />
      {children}
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-alert" : "bg-line"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-paper-raised shadow-sm transition-transform ${
          on ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </span>
  );
}

function Pill({
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
      className={`rounded-full border px-4 py-2 text-[14px] transition-all ${
        active
          ? "border-transparent bg-amber text-paper-raised shadow-[0_2px_8px_-2px_rgba(189,123,67,0.5)]"
          : "border-line bg-paper text-ink-soft hover:border-amber-soft"
      }`}
    >
      {children}
    </button>
  );
}
