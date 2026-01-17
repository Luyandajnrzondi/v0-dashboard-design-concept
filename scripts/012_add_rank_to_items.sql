-- Add rank column to items table for top 100 rankings
ALTER TABLE items ADD COLUMN IF NOT EXISTS rank INTEGER;

-- Create index for efficient rank queries
CREATE INDEX IF NOT EXISTS items_rank_idx ON items(category_id, rank);
