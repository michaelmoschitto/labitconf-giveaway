-- Comprehensive seed data for testing the giveaway functionality
-- This includes 15+ users with varied entry counts to test leaderboard tracking

-- Test user 1: Top user with lots of referrals and social share
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x1234567890abcdef1234567890abcdef12347891', 'top.user@test.com', 'MEZO7891', 1, 50, 3, TRUE, 10, NOW() - INTERVAL '5 days');

-- Test user 2: Second place with good referrals
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x1234567890abcdef1234567890abcdef12347890', 'second@test.com', 'MEZO7890', 1, 25, 3, TRUE, 5, NOW() - INTERVAL '4 days');

-- Test user 3: Third place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x1234567890abcdef1234567890abcdef12347892', 'third@test.com', 'MEZO7892', 1, 10, 3, TRUE, 2, NOW() - INTERVAL '3 days');

-- Test user 4: Fourth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x742d3e8f9a5b1c2d3e4f5a6b7c8d9e0f1a2b5Eb1', 'fourth@test.com', 'MEZO5EB1', 1, 5, 0, FALSE, 1, NOW() - INTERVAL '3 days');

-- Test user 5: Fifth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x5a6b7c8d9e0f1a2b3c4d5e6f7890abcdef123456', 'fifth@test.com', 'MEZO3456', 1, 5, 0, FALSE, 1, NOW() - INTERVAL '2 days');

-- Test user 6: Sixth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x6b7c8d9e0f1a2b3c4d5e6f7890abcdef12345678', 'sixth@test.com', 'MEZO5678', 1, 0, 3, TRUE, 0, NOW() - INTERVAL '2 days');

-- Test user 7: Seventh place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x7c8d9e0f1a2b3c4d5e6f7890abcdef1234567890', 'seventh@test.com', 'MEZO6790', 1, 0, 3, TRUE, 0, NOW() - INTERVAL '1 day');

-- Test user 8: Eighth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x8d9e0f1a2b3c4d5e6f7890abcdef12345678901a', 'eighth@test.com', 'MEZO901A', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '1 day');

-- Test user 9: Ninth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x9e0f1a2b3c4d5e6f7890abcdef12345678901abc', 'ninth@test.com', 'MEZO1ABC', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '12 hours');

-- Test user 10: Tenth place
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x0f1a2b3c4d5e6f7890abcdef12345678901abcde', 'tenth@test.com', 'MEZO1CDE', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '10 hours');

-- Test user 11: Just outside top 10 (position 11) - GOOD FOR TESTING 11th ROW
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x1a2b3c4d5e6f7890abcdef12345678901abcdef1', 'eleventh@test.com', 'MEZO1DEF', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '8 hours');

-- Test user 12: Position 12
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x2b3c4d5e6f7890abcdef12345678901abcdef123', 'twelfth@test.com', 'MEZO1F23', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '6 hours');

-- Test user 13: Position 13
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x3c4d5e6f7890abcdef12345678901abcdef12345', 'thirteenth@test.com', 'MEZO2345', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '4 hours');

-- Test user 14: Position 14
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x4d5e6f7890abcdef12345678901abcdef1234567', 'fourteenth@test.com', 'MEZO4567', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '2 hours');

-- Test user 15: Position 15 - WAY OUTSIDE TOP 10 for testing
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x5e6f7890abcdef12345678901abcdef123456789', 'fifteenth@test.com', 'MEZO6789', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '1 hour');

-- Test user 16: Brand new user
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x6f7890abcdef12345678901abcdef12345678901', 'newest@test.com', 'MEZO8901', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '30 minutes');

-- Test user 17: Another new user with referred_by
INSERT INTO public.giveaway_entries (wallet_address, email, referral_code, referred_by_code, base_entries, referral_entries, social_entries, social_shared, referral_count, created_at) VALUES
  ('0x7890abcdef12345678901abcdef1234567890123', 'referred@test.com', 'MEZO0123', 'MEZO7891', 1, 0, 0, FALSE, 0, NOW() - INTERVAL '15 minutes');
