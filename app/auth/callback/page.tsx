"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

/** Reads error params Supabase may put in either the query or the hash. */
function readAuthError(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    search.get("error_description") ??
    hash.get("error_description") ??
    search.get("error") ??
    hash.get("error")
  );
}

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      router.replace("/");
      return;
    }

    const urlError = readAuthError();
    if (urlError) {
      setError(urlError);
      return;
    }

    let done = false;
    const finish = () => {
      done = true;
      router.replace("/settings");
    };

    // supabase-js (detectSessionInUrl) exchanges the code automatically.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });

    // If the automatic exchange hasn't produced a session shortly, retry it
    // explicitly — the retry's error message tells us why it failed (the
    // automatic attempt swallows it).
    const code = new URLSearchParams(window.location.search).get("code");
    const t = window.setTimeout(async () => {
      if (done) return;
      if (!code) {
        setError("No sign-in code found in the link.");
        return;
      }
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) setError(error.message);
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [router]);

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-[22rem] text-center">
          <p className="font-serif text-[1.3rem] text-ink">
            Sign-in didn&apos;t complete
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            {error}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            Magic links only work in the same browser that requested them. If
            your email app opened this in a different browser, copy the link
            into the original one — or request a fresh link below.
          </p>
          <Link
            href="/settings"
            className="mt-5 inline-block rounded-2xl bg-ink px-5 py-3 text-[14px] font-medium text-paper-raised"
          >
            Back to settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center text-[14px] text-ink-soft">
      Signing you in…
    </div>
  );
}
