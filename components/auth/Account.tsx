"use client";

import { useAuth } from "@/lib/auth";
import { SignInCard } from "./SignInCard";
import { AccountMenu } from "./AccountMenu";

/** Renders the right account UI, or nothing when Supabase isn't configured. */
export function Account() {
  const { configured, session, status } = useAuth();
  if (!configured) return null;
  if (status === "loading") return null;
  return session ? <AccountMenu /> : <SignInCard />;
}
