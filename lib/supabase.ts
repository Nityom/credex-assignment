import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized to avoid crashing at build time when env vars aren't present.
let _client: SupabaseClient | null = null;

/**
 * Returns the server-side Supabase client (service role key).
 * Call this inside request handlers — never at module scope.
 */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    _client = createClient(url, key);
  }
  return _client;
}
