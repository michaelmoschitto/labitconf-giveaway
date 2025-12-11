-- Add telegram column to giveaway_entries table
-- This field is used to collect optional Telegram contact information
ALTER TABLE giveaway_entries
ADD COLUMN telegram VARCHAR(255);

-- Create index for efficient queries on telegram
CREATE INDEX idx_telegram ON giveaway_entries(telegram);

-- Add comment for documentation
COMMENT ON COLUMN giveaway_entries.telegram IS 'Optional Telegram username or phone number for contact';

