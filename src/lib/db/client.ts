import "server-only";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { dbConfig } from "@/lib/db/config";
import * as schema from "@/lib/db/schema";

import type { Database } from "@/lib/db/types";

export const db = drizzle({
  client: postgres(dbConfig.database.url, { prepare: false }),
  casing: "camelCase",
  schema,
});

// Admin client - bypasses RLS, use only for operations that need to bypass security
export const supabaseAdmin = createClient<Database>(
  dbConfig.supabase.url,
  dbConfig.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Public client - respects RLS policies, use for read operations
export const supabasePublic = createClient<Database>(
  dbConfig.supabase.url,
  dbConfig.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// For backward compatibility - use supabaseAdmin by default
export const supabase = supabaseAdmin;

export { schema };
