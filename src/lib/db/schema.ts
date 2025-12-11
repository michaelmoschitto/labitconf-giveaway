import { sql } from "drizzle-orm";
import {
  pgTable,
  index,
  unique,
  pgPolicy,
  check,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const giveawayEntries = pgTable(
  "giveaway_entries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    walletAddress: varchar("wallet_address", { length: 66 }).notNull(),
    referralCode: varchar("referral_code", { length: 10 }).notNull(),
    referredByCode: varchar("referred_by_code", { length: 10 }),
    referralCount: integer("referral_count").default(0).notNull(),
    baseEntries: integer("base_entries").default(1).notNull(),
    referralEntries: integer("referral_entries").default(0).notNull(),
    socialEntries: integer("social_entries").default(0).notNull(),
    totalEntries: integer("total_entries").generatedAlwaysAs(
      sql`((base_entries + referral_entries) + social_entries)`,
    ),
    socialShared: boolean("social_shared").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    email: varchar({ length: 255 }).default("").notNull(),
    labitconfCode: varchar("labitconf_code", { length: 255 }),
    telegram: varchar({ length: 255 }),
  },
  (table) => [
    index("idx_created_at").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("idx_email").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("idx_labitconf_code").using(
      "btree",
      table.labitconfCode.asc().nullsLast().op("text_ops"),
    ),
    index("idx_referral_code").using(
      "btree",
      table.referralCode.asc().nullsLast().op("text_ops"),
    ),
    index("idx_referred_by").using(
      "btree",
      table.referredByCode.asc().nullsLast().op("text_ops"),
    ),
    index("idx_telegram").using(
      "btree",
      table.telegram.asc().nullsLast().op("text_ops"),
    ),
    index("idx_total_entries_desc").using(
      "btree",
      table.totalEntries.desc().nullsFirst().op("int4_ops"),
    ),
    index("idx_wallet_address").using(
      "btree",
      table.walletAddress.asc().nullsLast().op("text_ops"),
    ),
    unique("giveaway_entries_wallet_address_key").on(table.walletAddress),
    unique("giveaway_entries_referral_code_key").on(table.referralCode),
    pgPolicy("Deny all deletes", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`false`,
    }),
    pgPolicy("Deny all updates", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Allow public insert with validation", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Allow public read access to entries", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check("max_referral_entries", sql`referral_entries <= 100`),
    check("max_social_entries", sql`social_entries <= 3`),
    check("max_referral_count", sql`referral_count <= 20`),
    check("positive_base_entries", sql`base_entries >= 1`),
    check("positive_referral_entries", sql`referral_entries >= 0`),
    check("positive_social_entries", sql`social_entries >= 0`),
    check("positive_referral_count", sql`referral_count >= 0`),
  ],
);
