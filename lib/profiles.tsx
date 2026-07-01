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
import { BABIES, BabyId } from "./types";
import { useAuth } from "./auth";
import { getSupabase } from "./supabase";
import { ProfileRow } from "./sync";

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

function isDefault(p: BabyProfile): boolean {
  const d = defaults().find((x) => x.id === p.id)!;
  return p.name === d.name && p.colorVar === d.colorVar && !p.birthday;
}

function rowToProfile(r: ProfileRow): BabyProfile {
  return {
    id: r.baby_id as BabyId,
    name: r.name,
    colorVar: r.color_var,
    birthday: r.birthday ?? undefined,
  };
}

interface ProfilesValue {
  profiles: BabyProfile[];
  ready: boolean;
  updateProfile: (id: BabyId, patch: Partial<Omit<BabyProfile, "id">>) => void;
}

const ProfilesContext = createContext<ProfilesValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const { configured, session, user } = useAuth();
  const cloud = configured && !!session;

  const [profiles, setProfiles] = useState<BabyProfile[]>(defaults());
  const [ready, setReady] = useState(false);

  const profilesRef = useRef<BabyProfile[]>(defaults());
  const householdRef = useRef<string | null>(null);
  const bootstrappedRef = useRef<string | null>(null);
  const updatedAtRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BabyProfile[];
        if (Array.isArray(parsed)) {
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
    profilesRef.current = profiles;
  }, [profiles]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // ignore
    }
  }, [profiles, ready]);

  useEffect(() => {
    if (!cloud) {
      bootstrappedRef.current = null;
      householdRef.current = null;
    }
  }, [cloud]);

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
      if (bootstrappedRef.current === hid) return;
      bootstrappedRef.current = hid as string;

      const { data: pulled } = await sb
        .from("profiles")
        .select("*")
        .eq("household_id", hid);
      if (cancelled) return;
      const cloudProfiles = ((pulled as ProfileRow[]) ?? []).map(rowToProfile);

      // One-time merge: keep local customisations only where the cloud row is
      // still at its default (so a partner's edits are never clobbered).
      const local = profilesRef.current;
      const merged = defaults().map((d) => {
        const c = cloudProfiles.find((x) => x.id === d.id) ?? d;
        const l = local.find((x) => x.id === d.id) ?? d;
        return isDefault(c) && !isDefault(l) ? l : c;
      });
      const toUpload = merged.filter((m) => {
        const c = cloudProfiles.find((x) => x.id === m.id);
        return c && isDefault(c) && !isDefault(m);
      });
      if (toUpload.length > 0) {
        await sb.from("profiles").upsert(
          toUpload.map((p) => ({
            household_id: hid,
            baby_id: p.id,
            name: p.name,
            color_var: p.colorVar,
            birthday: p.birthday ?? null,
          })),
          { onConflict: "household_id,baby_id" },
        );
      }
      updatedAtRef.current = new Map(
        ((pulled as ProfileRow[]) ?? []).map((r) => [r.baby_id, r.updated_at]),
      );
      setProfiles(merged);

      channel = sb
        .channel(`profiles:${hid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `household_id=eq.${hid}`,
          },
          (payload) => {
            const r = payload.new as ProfileRow;
            if (!r || !r.baby_id) return;
            const prev = updatedAtRef.current.get(r.baby_id);
            if (prev && prev >= r.updated_at) return;
            updatedAtRef.current.set(r.baby_id, r.updated_at);
            setProfiles((cur) =>
              cur.map((p) => (p.id === r.baby_id ? rowToProfile(r) : p)),
            );
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) sb.removeChannel(channel);
    };
  }, [cloud, ready, user?.id]);

  const updateProfile = useCallback(
    (id: BabyId, patch: Partial<Omit<BabyProfile, "id">>) => {
      const cur = profilesRef.current.find((p) => p.id === id);
      const next = cur ? { ...cur, ...patch, id } : undefined;
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
      );
      if (cloud && next) {
        const sb = getSupabase();
        const hid = householdRef.current;
        if (sb && hid) {
          void sb
            .from("profiles")
            .upsert(
              {
                household_id: hid,
                baby_id: id,
                name: next.name,
                color_var: next.colorVar,
                birthday: next.birthday ?? null,
              },
              { onConflict: "household_id,baby_id" },
            )
            .select("updated_at")
            .single()
            .then(({ data }) => {
              if (data?.updated_at)
                updatedAtRef.current.set(id, data.updated_at as string);
            });
        }
      }
    },
    [cloud],
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
  if (!ctx) throw new Error("useProfiles must be used within ProfilesProvider");
  return ctx;
}

export function useProfiles(): BabyProfile[] {
  return useProfilesContext().profiles;
}

export function useProfile(id: BabyId): BabyProfile {
  const profiles = useProfiles();
  return (
    profiles.find((p) => p.id === id) ?? defaults().find((p) => p.id === id)!
  );
}

export function useProfilesStore(): ProfilesValue {
  return useProfilesContext();
}
