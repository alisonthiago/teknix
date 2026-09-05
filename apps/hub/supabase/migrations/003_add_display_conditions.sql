ALTER TABLE pages ADD COLUMN IF NOT EXISTS display_conditions JSONB DEFAULT '[]';
ALTER TABLE page_widgets ADD COLUMN IF NOT EXISTS display_conditions JSONB DEFAULT '[]';
