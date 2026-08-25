-- Add photo_url and nickname to profiles if they do not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
