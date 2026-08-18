PRAGMA foreign_keys = ON;

ALTER TABLE media_assets ADD COLUMN placement TEXT NOT NULL DEFAULT 'unassigned';
ALTER TABLE media_assets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1));
ALTER TABLE media_assets ADD COLUMN title TEXT;
ALTER TABLE media_assets ADD COLUMN alt_text TEXT;

CREATE INDEX IF NOT EXISTS idx_media_assets_public_order ON media_assets(placement, published, sort_order);
