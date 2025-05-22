import { createSupabaseClient, SupabaseClient } from "../deps.ts";
import { Database } from "../types/supabase.ts";

// use service token to get the integration
const client = createSupabaseClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_KEY")!,
);

export function getClient() {
  return client;
}

export type Client = SupabaseClient<Database>;


