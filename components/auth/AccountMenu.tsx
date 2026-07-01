"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/common";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function invite() {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    const { data } = await sb.rpc("create_invite");
    setBusy(false);
    if (typeof data === "string") setCode(data);
  }

  const link =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${code}`
      : null;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-sage" />
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Synced
        </span>
      </div>
      <p className="mt-1.5 truncate text-[15px] text-ink">{user?.email}</p>

      {link ? (
        <div className="mt-4 rounded-2xl border border-line-soft bg-paper p-3">
          <p className="text-[12.5px] text-ink-soft">
            Share this link with your partner to join your household:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-paper-sunk px-2.5 py-1.5 text-[12px] text-ink">
              {link}
            </code>
            <button
              onClick={copy}
              className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-paper-raised"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={invite}
          disabled={busy}
          className="mt-4 w-full rounded-2xl border border-line bg-paper py-3 text-[14px] font-medium text-ink transition-colors active:bg-paper-sunk disabled:text-ink-faint"
        >
          {busy ? "Creating…" : "Invite partner"}
        </button>
      )}

      <button
        onClick={() => void signOut()}
        className="mt-2 w-full rounded-2xl py-2.5 text-[13.5px] font-medium text-ink-soft transition-colors active:bg-paper-sunk"
      >
        Sign out
      </button>
    </Card>
  );
}
