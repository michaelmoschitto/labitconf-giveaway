/**
 * Row Level Security (RLS) Policy Tests
 *
 * These tests verify that RLS policies are correctly enforcing access control.
 * They test direct database access with both admin and public clients.
 *
 * NOTE: These tests require the RLS migration to be applied to your test database.
 */

import { createClient } from "@supabase/supabase-js";
import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "bun:test";

import { dbConfig } from "@/lib/db/config";

import type { Database } from "@/lib/db/types";

// Create test clients directly without importing from client module
const supabaseAdmin = createClient<Database>(
  dbConfig.supabase.url,
  dbConfig.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const supabasePublic = createClient<Database>(
  dbConfig.supabase.url,
  dbConfig.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

describe("RLS Policies", () => {
  const testWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
  const testReferralCode = Math.random()
    .toString(36)
    .slice(2, 12)
    .toUpperCase();

  describe("SELECT Policy - Public Read Access", () => {
    beforeAll(async () => {
      // Insert a test entry using admin client
      await supabaseAdmin.from("giveaway_entries").insert({
        wallet_address: testWallet,
        referral_code: testReferralCode,
      });
    });

    afterAll(async () => {
      // Cleanup
      await supabaseAdmin
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", testWallet);
    });

    it("should allow anonymous SELECT with public client", async () => {
      const { data, error } = await supabasePublic
        .from("giveaway_entries")
        .select("*")
        .eq("wallet_address", testWallet)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.wallet_address).toBe(testWallet);
    });

    it("should allow admin SELECT", async () => {
      const { data, error } = await supabaseAdmin
        .from("giveaway_entries")
        .select("*")
        .eq("wallet_address", testWallet)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe("INSERT Policy - Public Insert with Validation", () => {
    const insertWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
    const insertReferralCode = Math.random()
      .toString(36)
      .slice(2, 12)
      .toUpperCase();

    afterEach(async () => {
      // Cleanup
      await supabaseAdmin
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", insertWallet);
    });

    it("should allow valid INSERT with public client", async () => {
      const { data, error } = await supabasePublic
        .from("giveaway_entries")
        .insert({
          wallet_address: insertWallet,
          referral_code: insertReferralCode,
          base_entries: 1,
          referral_entries: 0,
          social_entries: 0,
          referral_count: 0,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.wallet_address).toBe(insertWallet);
    });

    it("should enforce validation in INSERT policy", async () => {
      // Try to insert with invalid referral_entries (> 100)
      const invalidWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;

      const { error } = await supabasePublic.from("giveaway_entries").insert({
        wallet_address: invalidWallet,
        referral_code: Math.random().toString(36).slice(2, 12),
        base_entries: 1,
        referral_entries: 101, // Invalid: > 100
        social_entries: 0,
        referral_count: 0,
      });

      // Should fail due to CHECK constraint or policy
      expect(error).toBeTruthy();
    });
  });

  describe("UPDATE Policy - Deny Anonymous Updates", () => {
    const updateWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
    const updateReferralCode = Math.random()
      .toString(36)
      .slice(2, 12)
      .toUpperCase();

    beforeAll(async () => {
      // Insert test entry with admin client
      await supabaseAdmin.from("giveaway_entries").insert({
        wallet_address: updateWallet,
        referral_code: updateReferralCode,
      });
    });

    afterAll(async () => {
      // Cleanup
      await supabaseAdmin
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", updateWallet);
    });

    it("should deny UPDATE with public client", async () => {
      const { data, error } = await supabasePublic
        .from("giveaway_entries")
        .update({ referral_entries: 5 })
        .eq("wallet_address", updateWallet)
        .select();

      // Should fail due to RLS policy - either error exists OR no rows were updated
      expect(error || data?.length === 0).toBeTruthy();
      if (error) {
        console.log("UPDATE blocked with error:", error.message);
      } else if (data?.length === 0) {
        console.log("UPDATE blocked - no rows affected");
      }
    });

    it("should allow UPDATE with admin client (bypasses RLS)", async () => {
      const { data, error } = await supabaseAdmin
        .from("giveaway_entries")
        .update({ referral_entries: 5 })
        .eq("wallet_address", updateWallet)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.referral_entries).toBe(5);
    });
  });

  describe("DELETE Policy - Deny All Deletes", () => {
    const deleteWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
    const deleteReferralCode = Math.random()
      .toString(36)
      .slice(2, 12)
      .toUpperCase();

    beforeEach(async () => {
      // Insert test entry with admin client
      await supabaseAdmin.from("giveaway_entries").insert({
        wallet_address: deleteWallet,
        referral_code: deleteReferralCode,
      });
    });

    afterEach(async () => {
      // Force cleanup with admin client
      await supabaseAdmin
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", deleteWallet);
    });

    it("should deny DELETE with public client", async () => {
      const { data, error } = await supabasePublic
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", deleteWallet)
        .select();

      // Should fail due to RLS policy - either error exists OR no rows were deleted
      expect(error || data?.length === 0).toBeTruthy();
      if (error) {
        console.log("DELETE blocked with error:", error.message);
      } else if (data?.length === 0) {
        console.log("DELETE blocked - no rows affected");
      }
    });

    it("should allow DELETE with admin client (bypasses RLS)", async () => {
      const { error } = await supabaseAdmin
        .from("giveaway_entries")
        .delete()
        .eq("wallet_address", deleteWallet);

      expect(error).toBeNull();
    });
  });

  describe("Stored Functions - Should Work with RLS", () => {
    it("should allow calling get_leaderboard with public client", async () => {
      const { data, error } = await supabasePublic.rpc("get_leaderboard", {
        limit_count: 5,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should allow calling get_user_position with public client", async () => {
      // Try with a non-existent wallet (should return empty array, not error)
      const { data, error } = await supabasePublic.rpc("get_user_position", {
        user_wallet: "0x0000000000000000000000000000000000000000",
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
