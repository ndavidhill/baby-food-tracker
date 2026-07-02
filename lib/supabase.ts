import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Strip whitespace (incl. line-wraps from pasting into dashboards): a stray
// newline in the key/URL makes every fetch throw TypeError in the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\s+/g, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s+/g, "");

/** True only when both public env vars are present. */
export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

/**
 * Returns a memoized browser client, or null when Supabase isn't configured
 * (so the whole app degrades to pure local mode with no network).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}
