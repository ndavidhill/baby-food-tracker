"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/common";

export function SignInCard() {
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | undefined>();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await signInWithOtp(email.trim());
    if (error) {
      setError(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <Card className="p-5 text-center">
        <p className="font-serif text-[1.15rem] text-ink">Check your email</p>
        <p className="mx-auto mt-1.5 max-w-[18rem] text-[13.5px] leading-relaxed text-ink-soft">
          We sent a sign-in link to{" "}
          <span className="font-medium text-ink">{email}</span>. Open it on this
          device to finish signing in.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="font-serif text-[1.2rem] text-ink">Sync across devices</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
        Sign in to back up your data and share it with a partner. No password —
        we&apos;ll email you a link.
      </p>
      <form onSubmit={send} className="mt-4 space-y-2.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-amber-soft focus:bg-paper-raised"
        />
        <button
          type="submit"
          disabled={status === "sending" || !email.trim()}
          className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-medium text-paper-raised transition-all active:scale-[0.99] disabled:bg-line disabled:text-ink-faint"
        >
          {status === "sending" ? "Sending…" : "Email me a link"}
        </button>
        {status === "error" && (
          <p className="px-1 text-[12.5px] text-alert">{error}</p>
        )}
      </form>
    </Card>
  );
}
