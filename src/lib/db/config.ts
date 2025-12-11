const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL environment variable is required",
    );
  }
  return url;
};

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is required",
    );
  }
  return url;
};

const getSupabaseServiceRoleKey = (): string => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
    );
  }
  return key;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
    );
  }
  return key;
};

export const dbConfig = {
  database: {
    url: getDatabaseUrl(),
  },

  supabase: {
    url: getSupabaseUrl(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
    anonKey: getSupabaseAnonKey(),
  },
};
