"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      router.replace("/");
      return;
    }
    // supabase-js (detectSessionInUrl) exchanges the code automatically.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/settings");
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/settings");
    });
    const t = window.setTimeout(() => router.replace("/"), 8000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [router]);

  return (
    <div className="grid min-h-dvh place-items-center text-[14px] text-ink-soft">
      Signing you in…
    </div>
  );
}
