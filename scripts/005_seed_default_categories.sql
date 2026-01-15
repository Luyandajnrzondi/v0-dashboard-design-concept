-- Seed default categories with their types and icons
INSERT INTO categories (name, type, icon) VALUES
  ('Movies & TV Shows', 'media', 'film'),
  ('Music', 'music', 'music'),
  ('Books & Podcasts', 'reading', 'book-open'),
  ('Year Goals', 'goals', 'target'),
  ('Gym & Fitness', 'fitness', 'dumbbell'),
  ('Games', 'games', 'gamepad-2'),
  ('Travel & Places', 'travel', 'map-pin'),
  ('Ideas & Notes', 'ideas', 'lightbulb'),
  ('Career & Learning', 'career', 'briefcase')
ON CONFLICT DO NOTHING;
