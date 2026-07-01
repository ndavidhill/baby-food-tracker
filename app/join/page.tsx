"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/common";
import { SignInCard } from "@/components/auth/SignInCard";

export default function JoinPage() {
  const { configured, session, status } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "joining" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get("code"));
  }, []);

  useEffect(() => {
    if (!configured || !session || !code || state !== "idle") return;
    const sb = getSupabase();
    if (!sb) return;
    setState("joining");
    (async () => {
      const { error } = await sb.rpc("join_household", { invite_code: code });
      if (error) {
        setError(error.message);
        setState("error");
      } else {
        setState("done");
      }
    })();
  }, [configured, session, code, state]);

  return (
    <div className="animate-soft-in">
      <header className="mb-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          Invitation
        </p>
        <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
          Join a household
        </h1>
      </header>

      {!configured ? (
        <Card className="p-5 text-[14px] text-ink-soft">
          Cloud sync isn&apos;t set up on this app yet.
        </Card>
      ) : !code ? (
        <Card className="p-5 text-[14px] text-ink-soft">
          This link is missing its invite code.
        </Card>
      ) : status === "loading" ? null : !session ? (
        <div className="space-y-3">
          <p className="px-1 text-[14px] text-ink-soft">
            Sign in to join, then you&apos;ll share the same twins and logs.
          </p>
          <SignInCard />
        </div>
      ) : state === "done" ? (
        <Card className="p-6 text-center">
          <p className="font-serif text-[1.2rem] text-ink">You&apos;re in</p>
          <p className="mx-auto mt-1.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-soft">
            You now share the household. Everything syncs automatically.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-2xl bg-ink px-5 py-3 text-[14px] font-medium text-paper-raised"
          >
            Open the app
          </Link>
        </Card>
      ) : state === "error" ? (
        <Card className="p-5 text-center">
          <p className="font-serif text-[1.15rem] text-ink">
            That didn&apos;t work
          </p>
          <p className="mx-auto mt-1.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-soft">
            {error ?? "The invite may have expired."}
          </p>
        </Card>
      ) : (
        <Card className="p-5 text-center text-[14px] text-ink-soft">
          Joining…
        </Card>
      )}
    </div>
  );
}
