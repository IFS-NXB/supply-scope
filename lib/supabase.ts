import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function url(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseEnabled(): boolean {
  return Boolean(url() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Server-side client using the service-role key (bypasses RLS for trusted writes).
export function supabase(): SupabaseClient | null {
  if (!supabaseEnabled()) return null;
  if (!client) {
    client = createClient(url()!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
