"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BABIES, BabyId } from "./types";

/** Editable per-twin display data (name/colour/birthday). BabyId stays fixed. */
export interface BabyProfile {
  id: BabyId;
  name: string;
  colorVar: string;
  /** yyyy-mm-dd, optional. */
  birthday?: string;
}

const STORAGE_KEY = "bft.profiles.v1";

function defaults(): BabyProfile[] {
  return BABIES.map((b) => ({ id: b.id, name: b.name, colorVar: b.colorVar }));
}

interface ProfilesValue {
  profiles: BabyProfile[];
  ready: boolean;
  updateProfile: (id: BabyId, patch: Partial<Omit<BabyProfile, "id">>) => void;
}

const ProfilesContext = createContext<ProfilesValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<BabyProfile[]>(defaults());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BabyProfile[];
        if (Array.isArray(parsed)) {
          // Overlay stored values onto defaults so new fields survive upgrades.
          setProfiles(
            defaults().map((d) => ({
              ...d,
              ...(parsed.find((p) => p.id === d.id) ?? {}),
              id: d.id,
            })),
          );
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // ignore quota / private-mode failures
    }
  }, [profiles, ready]);

  const updateProfile = useCallback(
    (id: BabyId, patch: Partial<Omit<BabyProfile, "id">>) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({ profiles, ready, updateProfile }),
    [profiles, ready, updateProfile],
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
}

function useProfilesContext(): ProfilesValue {
  const ctx = useContext(ProfilesContext);
  if (!ctx)
    throw new Error("useProfiles must be used within ProfilesProvider");
  return ctx;
}

export function useProfiles(): BabyProfile[] {
  return useProfilesContext().profiles;
}

export function useProfile(id: BabyId): BabyProfile {
  const profiles = useProfiles();
  return profiles.find((p) => p.id === id) ?? defaults().find((p) => p.id === id)!;
}

/** Full store value (profiles + ready + updateProfile) for the settings screen. */
export function useProfilesStore(): ProfilesValue {
  return useProfilesContext();
}
