-- Allow special referral codes (like conference codes) that don't have a corresponding entry
-- This enables codes like "labtc2025" to be used without needing an actual user entry

-- Drop the existing foreign key constraint
-- We validate referral codes in the application layer, so we don't need DB-level enforcement
-- This allows special codes (like labtc2025) to be stored without a corresponding entry
ALTER TABLE public.giveaway_entries 
  DROP CONSTRAINT IF EXISTS fk_referrer;

-- Add a comment explaining special codes
COMMENT ON COLUMN public.giveaway_entries.referred_by_code IS 
  'Referral code used by this user. Can be a regular user code or a special event code (e.g., labtc2025 for conference attendees). Validated at application level.';

