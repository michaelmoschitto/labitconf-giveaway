-- Enable Row Level Security on giveaway_entries table
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to entries" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Allow public insert with validation" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Deny all updates" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Deny all deletes" ON public.giveaway_entries;

-- Policy 1: Allow public SELECT (anyone can view leaderboard)
CREATE POLICY "Allow public read access to entries"
  ON public.giveaway_entries
  FOR SELECT
  USING (true);

-- Policy 2: Allow public INSERT (anyone can create entry, uniqueness enforced by constraints)
CREATE POLICY "Allow public insert with validation"
  ON public.giveaway_entries
  FOR INSERT
  WITH CHECK (
    -- Ensure wallet_address is provided and properly formatted
    wallet_address IS NOT NULL
    AND length(wallet_address) >= 26
    AND length(wallet_address) <= 66
    -- Ensure referral_code is provided
    AND referral_code IS NOT NULL
    AND length(referral_code) = 10
    -- Ensure base_entries starts at 1
    AND base_entries >= 1
    -- Ensure entry counts are within valid ranges
    AND referral_entries >= 0
    AND referral_entries <= 100
    AND social_entries >= 0
    AND social_entries <= 3
    AND referral_count >= 0
    AND referral_count <= 20
  );

-- Policy 3: Deny all UPDATE operations from anonymous/public users
-- Updates should only happen through stored functions with service role
-- This explicitly checks that the user is authenticated with service role
CREATE POLICY "Deny all updates"
  ON public.giveaway_entries
  FOR UPDATE
  TO public, anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Policy 4: Deny all DELETE operations
CREATE POLICY "Deny all deletes"
  ON public.giveaway_entries
  FOR DELETE
  USING (false);

-- Add comments explaining the security model
COMMENT ON POLICY "Allow public read access to entries" ON public.giveaway_entries IS 
  'Public read access for leaderboard display. No authentication required.';

COMMENT ON POLICY "Allow public insert with validation" ON public.giveaway_entries IS 
  'Allow entry creation with validation. Uniqueness enforced by table constraints.';

COMMENT ON POLICY "Deny all updates" ON public.giveaway_entries IS 
  'Updates only allowed via stored functions called with service role key.';

COMMENT ON POLICY "Deny all deletes" ON public.giveaway_entries IS 
  'Deletes are not allowed to maintain contest integrity.';

