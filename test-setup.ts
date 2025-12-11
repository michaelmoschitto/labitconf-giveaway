/**
 * Test setup file - loaded before all tests
 * This ensures mocks are set up before any modules are loaded
 */

// Set environment variables first
process.env.IS_LOCAL = "true";

// Import Bun's mock functionality
import { mock } from "bun:test";

// Mock server-only FIRST, before any other imports
mock.module("server-only", () => ({}));

// Import test DB utilities
import { testDb, testSupabase } from "@/lib/db/__tests__/test-client";

// Mock the DB client module
mock.module("@/lib/db/client", () => ({
  db: testDb,
  supabase: testSupabase,
  supabaseAdmin: testSupabase,
  supabasePublic: testSupabase,
}));
