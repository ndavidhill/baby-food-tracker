"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type AuthStatus = "local" | "loading" | "signed-in" | "signed-out";

interface AuthValue {
  configured: boolean;
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured;
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    configured ? "loading" : "local",
  );

  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    if (!sb) return;
    let mounted = true;

    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setStatus(s ? "signed-in" : "signed-out");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithOtp = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { error: "Cloud sync is not configured." };
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    await sb?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      configured,
      status,
      session,
      user: session?.user ?? null,
      signInWithOtp,
      signOut,
    }),
    [configured, status, session, signInWithOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
