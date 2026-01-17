-- Update existing media categories or seed new ones for separate Movies and TV Shows
-- This script adds the new category types

-- Note: You may want to manually update existing categories
-- or create new ones with these specific types:
-- - 'movies' for Movies
-- - 'tvshows' for TV Shows  
-- - 'music' for Music Albums
-- - 'reading' for Books

-- Example: Insert default categories if they don't exist
INSERT INTO categories (name, type, icon) 
VALUES 
  ('Movies', 'movies', 'film'),
  ('TV Shows', 'tvshows', 'tv'),
  ('Music Albums', 'music', 'music'),
  ('Books', 'reading', 'book-open')
ON CONFLICT DO NOTHING;
