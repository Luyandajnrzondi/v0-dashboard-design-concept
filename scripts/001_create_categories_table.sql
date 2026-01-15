-- Create categories table for sidebar navigation
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories (public dashboard)
CREATE POLICY "Allow public read access to categories" 
  ON categories FOR SELECT 
  USING (true);

-- Allow anyone to insert categories (for demo purposes, adjust for auth later)
CREATE POLICY "Allow public insert access to categories" 
  ON categories FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update categories
CREATE POLICY "Allow public update access to categories" 
  ON categories FOR UPDATE 
  USING (true);

-- Allow anyone to delete categories
CREATE POLICY "Allow public delete access to categories" 
  ON categories FOR DELETE 
  USING (true);
