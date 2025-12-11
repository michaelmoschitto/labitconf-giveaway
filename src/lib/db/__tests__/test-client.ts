import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { dbConfig } from "@/lib/db/config";
import * as schema from "@/lib/db/schema";

import type { Database } from "@/lib/db/types";

export const testDb = drizzle({
  client: postgres(dbConfig.database.url, { prepare: false }),
  casing: "camelCase",
  schema,
});

export const testSupabase = createClient<Database>(
  dbConfig.supabase.url,
  dbConfig.supabase.serviceRoleKey,
);

export { schema };
