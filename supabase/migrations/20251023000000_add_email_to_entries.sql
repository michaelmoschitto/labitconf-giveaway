-- Add email column to giveaway_entries table
-- Using nullable first since table might have existing data
ALTER TABLE giveaway_entries
ADD COLUMN email VARCHAR(255);

-- Update existing rows to have empty string as default
UPDATE giveaway_entries
SET email = ''
WHERE email IS NULL;

-- Create index for email lookups
CREATE INDEX idx_email ON giveaway_entries(email);

-- Add comment
COMMENT ON COLUMN giveaway_entries.email IS 'User email address for giveaway notifications';

-- Set default value and make email NOT NULL
ALTER TABLE giveaway_entries
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN email SET NOT NULL;

