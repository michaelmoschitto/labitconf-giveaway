-- Add labitconf_code column to giveaway_entries table
-- This field is used to identify Labitconf attendees for guaranteed prize eligibility
ALTER TABLE giveaway_entries
ADD COLUMN labitconf_code VARCHAR(255);

-- Create index for efficient queries on labitconf_code
CREATE INDEX idx_labitconf_code ON giveaway_entries(labitconf_code);

-- Add comment for documentation
COMMENT ON COLUMN giveaway_entries.labitconf_code IS 'Labitconf attendee code for guaranteed prize eligibility';

