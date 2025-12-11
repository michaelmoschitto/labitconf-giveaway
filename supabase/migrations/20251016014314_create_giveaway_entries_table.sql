-- Create giveaway_entries table
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(66) UNIQUE NOT NULL, -- Support both Ethereum (42 chars) and Bitcoin addresses
  
  -- Referral system
  referral_code VARCHAR(10) UNIQUE NOT NULL,
  referred_by_code VARCHAR(10),
  referral_count INTEGER DEFAULT 0 NOT NULL, -- Number of successful referrals (max 20)
  
  -- Entry tracking
  base_entries INTEGER DEFAULT 1 NOT NULL,
  referral_entries INTEGER DEFAULT 0 NOT NULL, -- Bonus entries from referring others (max 100)
  social_entries INTEGER DEFAULT 0 NOT NULL, -- Bonus entries from social sharing (max 3)
  total_entries INTEGER GENERATED ALWAYS AS (base_entries + referral_entries + social_entries) STORED,
  
  -- Feature flags
  social_shared BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT max_referral_entries CHECK (referral_entries <= 100),
  CONSTRAINT max_social_entries CHECK (social_entries <= 3),
  CONSTRAINT max_referral_count CHECK (referral_count <= 20),
  CONSTRAINT positive_base_entries CHECK (base_entries >= 1),
  CONSTRAINT positive_referral_entries CHECK (referral_entries >= 0),
  CONSTRAINT positive_social_entries CHECK (social_entries >= 0),
  CONSTRAINT positive_referral_count CHECK (referral_count >= 0),
  CONSTRAINT fk_referrer FOREIGN KEY (referred_by_code) 
    REFERENCES public.giveaway_entries(referral_code) 
    ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_referral_code ON public.giveaway_entries(referral_code);
CREATE INDEX idx_total_entries_desc ON public.giveaway_entries(total_entries DESC);
CREATE INDEX idx_referred_by ON public.giveaway_entries(referred_by_code);
CREATE INDEX idx_created_at ON public.giveaway_entries(created_at);
CREATE INDEX idx_wallet_address ON public.giveaway_entries(wallet_address);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_giveaway_entries_updated_at
  BEFORE UPDATE ON public.giveaway_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get leaderboard (top N entries)
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  wallet_address VARCHAR,
  total_entries INTEGER,
  referral_count INTEGER,
  social_shared BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY e.total_entries DESC, e.created_at ASC) as rank,
    e.wallet_address,
    e.total_entries,
    e.referral_count,
    e.social_shared,
    e.created_at
  FROM public.giveaway_entries e
  ORDER BY e.total_entries DESC, e.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user position in leaderboard
CREATE OR REPLACE FUNCTION public.get_user_position(user_wallet VARCHAR)
RETURNS TABLE (
  rank BIGINT,
  wallet_address VARCHAR,
  total_entries INTEGER,
  referral_count INTEGER,
  social_shared BOOLEAN,
  referral_code VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_entries AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY e.total_entries DESC, e.created_at ASC) as rank,
      e.wallet_address,
      e.total_entries,
      e.referral_count,
      e.social_shared,
      e.referral_code,
      e.created_at
    FROM public.giveaway_entries e
  )
  SELECT * FROM ranked_entries
  WHERE ranked_entries.wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql;

-- Create function to credit referral (atomic operation)
CREATE OR REPLACE FUNCTION public.credit_referral(
  referrer_code VARCHAR,
  new_user_wallet VARCHAR,
  referrer_bonus INTEGER DEFAULT 5,
  new_user_bonus INTEGER DEFAULT 2
)
RETURNS JSON AS $$
DECLARE
  referrer_wallet VARCHAR;
  referrer_current_count INTEGER;
  result JSON;
BEGIN
  -- Get referrer info
  SELECT wallet_address, referral_count 
  INTO referrer_wallet, referrer_current_count
  FROM public.giveaway_entries 
  WHERE referral_code = referrer_code;
  
  -- Check if referrer exists
  IF referrer_wallet IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Referrer not found'
    );
  END IF;
  
  -- Check if referrer hasn't exceeded max referrals
  IF referrer_current_count >= 20 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Referrer has reached maximum referrals'
    );
  END IF;
  
  -- Check for self-referral
  IF referrer_wallet = new_user_wallet THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Self-referral not allowed'
    );
  END IF;
  
  -- Update referrer (add entries and increment count)
  UPDATE public.giveaway_entries
  SET 
    referral_entries = LEAST(referral_entries + referrer_bonus, 100),
    referral_count = referral_count + 1,
    updated_at = NOW()
  WHERE wallet_address = referrer_wallet;
  
  -- Update new user (add bonus entries)
  UPDATE public.giveaway_entries
  SET 
    base_entries = base_entries + new_user_bonus,
    updated_at = NOW()
  WHERE wallet_address = new_user_wallet;
  
  RETURN json_build_object(
    'success', TRUE,
    'referrer_wallet', referrer_wallet,
    'new_user_wallet', new_user_wallet,
    'referrer_bonus', referrer_bonus,
    'new_user_bonus', new_user_bonus
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to credit social share (one-time only)
CREATE OR REPLACE FUNCTION public.credit_social_share(
  user_wallet VARCHAR,
  bonus INTEGER DEFAULT 3
)
RETURNS JSON AS $$
DECLARE
  already_shared BOOLEAN;
BEGIN
  -- Check if user already shared
  SELECT social_shared INTO already_shared
  FROM public.giveaway_entries
  WHERE wallet_address = user_wallet;
  
  IF already_shared IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'User not found'
    );
  END IF;
  
  IF already_shared THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Social share bonus already claimed'
    );
  END IF;
  
  -- Update user
  UPDATE public.giveaway_entries
  SET 
    social_entries = LEAST(social_entries + bonus, 3),
    social_shared = TRUE,
    updated_at = NOW()
  WHERE wallet_address = user_wallet;
  
  RETURN json_build_object(
    'success', TRUE,
    'wallet_address', user_wallet,
    'bonus', bonus
  );
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE public.giveaway_entries IS 'Stores giveaway entry data for LATAM Bitcoin giveaway';
COMMENT ON COLUMN public.giveaway_entries.wallet_address IS 'User wallet address (Ethereum or Bitcoin format)';
COMMENT ON COLUMN public.giveaway_entries.referral_code IS 'Unique referral code generated for this user';
COMMENT ON COLUMN public.giveaway_entries.referred_by_code IS 'Referral code of the user who referred this user (if any)';
COMMENT ON COLUMN public.giveaway_entries.base_entries IS 'Base entry count (1 minimum + bonuses from referrals as referee)';
COMMENT ON COLUMN public.giveaway_entries.referral_entries IS 'Bonus entries from referring others (max 100 = 20 referrals * 5)';
COMMENT ON COLUMN public.giveaway_entries.social_entries IS 'Bonus entries from social sharing (max 3)';
COMMENT ON COLUMN public.giveaway_entries.total_entries IS 'Total entries (automatically calculated)';
COMMENT ON COLUMN public.giveaway_entries.referral_count IS 'Number of successful referrals (max 20)';
COMMENT ON COLUMN public.giveaway_entries.social_shared IS 'Whether user has claimed social sharing bonus';

