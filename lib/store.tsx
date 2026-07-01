"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BabyId, LogEntry } from "./types";
import { useAuth } from "./auth";
import { getSupabase } from "./supabase";
import { EntryRow, entryToRow, rowToEntry } from "./sync";

const STORAGE_KEY = "bft.entries.v1";

interface StoreValue {
  entries: LogEntry[];
  ready: boolean;
  addEntry: (entry: Omit<LogEntry, "id" | "ts">) => void;
  updateEntry: (id: string, patch: Partial<LogEntry>) => void;
  removeEntry: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.round(
    performance.now() * 1000,
  ).toString(36)}`;
}

const sortEntries = (arr: LogEntry[]) => [...arr].sort((a, b) => b.ts - a.ts);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { configured, session, user } = useAuth();
  const cloud = configured && !!session;

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);

  const entriesRef = useRef<LogEntry[]>([]);
  const householdRef = useRef<string | null>(null);
  const updatedAtRef = useRef<Map<string, string>>(new Map());
  const bootstrappedRef = useRef<string | null>(null);

  // Load local cache once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LogEntry[];
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      // start clean on corrupt storage
    }
    setReady(true);
  }, []);

  // Keep a ref of the latest entries (for the async bootstrap upload).
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Persist the visible entries to the local cache (offline snapshot).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore quota / private-mode
    }
  }, [entries, ready]);

  // Reset the bootstrap guard whenever we leave cloud mode.
  useEffect(() => {
    if (!cloud) {
      bootstrappedRef.current = null;
      householdRef.current = null;
    }
  }, [cloud]);

  // Cloud bootstrap (merge) + realtime subscription.
  useEffect(() => {
    if (!cloud || !ready) return;
    const sb = getSupabase();
    if (!sb) return;

    let cancelled = false;
    let channel: ReturnType<typeof sb.channel> | null = null;

    (async () => {
      const { data: hid, error } = await sb.rpc("ensure_household");
      if (error || !hid || cancelled) return;
      householdRef.current = hid as string;
      if (bootstrappedRef.current === hid) return; // StrictMode / re-run guard
      bootstrappedRef.current = hid as string;

      // Upload local entries first (idempotent upsert by id).
      const local = entriesRef.current;
      if (local.length > 0) {
        const rows = local.map((e) =>
          entryToRow(e, hid as string, user?.id ?? null, false),
        );
        await sb.from("entries").upsert(rows, { onConflict: "id" });
      }

      // Pull the merged cloud set.
      const { data: pulled } = await sb
        .from("entries")
        .select("*")
        .eq("household_id", hid);
      if (cancelled || !pulled) return;
      const rows = pulled as EntryRow[];
      updatedAtRef.current = new Map(rows.map((r) => [r.id, r.updated_at]));
      setEntries(sortEntries(rows.filter((r) => !r.deleted).map(rowToEntry)));

      // Live updates.
      channel = sb
        .channel(`entries:${hid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "entries",
            filter: `household_id=eq.${hid}`,
          },
          (payload) => {
            const r = payload.new as EntryRow;
            if (!r || !r.id) return;
            const prev = updatedAtRef.current.get(r.id);
            if (prev && prev >= r.updated_at) return; // LWW + echo dedupe
            updatedAtRef.current.set(r.id, r.updated_at);
            setEntries((cur) => {
              const without = cur.filter((e) => e.id !== r.id);
              return r.deleted
                ? without
                : sortEntries([rowToEntry(r), ...without]);
            });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) sb.removeChannel(channel);
    };
  }, [cloud, ready, user?.id]);

  const pushRow = useCallback(
    async (e: LogEntry, deleted: boolean) => {
      const sb = getSupabase();
      const hid = householdRef.current;
      if (!sb || !hid) return;
      const { data } = await sb
        .from("entries")
        .upsert(entryToRow(e, hid, user?.id ?? null, deleted), {
          onConflict: "id",
        })
        .select("updated_at")
        .single();
      if (data?.updated_at)
        updatedAtRef.current.set(e.id, data.updated_at as string);
    },
    [user?.id],
  );

  const addEntry = useCallback(
    (entry: Omit<LogEntry, "id" | "ts">) => {
      const e: LogEntry = { ...entry, id: makeId(), ts: Date.now() };
      setEntries((prev) => sortEntries([e, ...prev]));
      if (cloud) void pushRow(e, false);
    },
    [cloud, pushRow],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<LogEntry>) => {
      const cur = entriesRef.current.find((e) => e.id === id);
      const updated = cur ? { ...cur, ...patch } : undefined;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
      if (cloud && updated) void pushRow(updated, false);
    },
    [cloud, pushRow],
  );

  const removeEntry = useCallback(
    (id: string) => {
      const removed = entriesRef.current.find((e) => e.id === id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (cloud && removed) void pushRow(removed, true);
    },
    [cloud, pushRow],
  );

  const value = useMemo(
    () => ({ entries, ready, addEntry, updateEntry, removeEntry }),
    [entries, ready, addEntry, updateEntry, removeEntry],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Entries for a single baby, newest first. */
export function useBabyEntries(babyId: BabyId): LogEntry[] {
  const { entries } = useStore();
  return useMemo(
    () => entries.filter((e) => e.babyId === babyId).sort((a, b) => b.ts - a.ts),
    [entries, babyId],
  );
}
