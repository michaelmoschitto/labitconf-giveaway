import { defineConfig } from "drizzle-kit";

import { dbConfig } from "@/lib/db/config";

export default defineConfig({
  out: "./src/lib/db",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbConfig.database.url,
  },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
