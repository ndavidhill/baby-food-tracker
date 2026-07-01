"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BabyId, LogEntry } from "./types";

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
  // Prefer crypto.randomUUID where available; fall back to a timestamped id.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.round(
    performance.now() * 1000,
  ).toString(36)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LogEntry[];
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      // Corrupt or unavailable storage — start clean rather than crash.
    }
    setReady(true);
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota / private-mode write failures.
    }
  }, [entries, ready]);

  const addEntry = useCallback((entry: Omit<LogEntry, "id" | "ts">) => {
    setEntries((prev) => [
      { ...entry, id: makeId(), ts: Date.now() },
      ...prev,
    ]);
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<LogEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

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
    () =>
      entries
        .filter((e) => e.babyId === babyId)
        .sort((a, b) => b.ts - a.ts),
    [entries, babyId],
  );
}
