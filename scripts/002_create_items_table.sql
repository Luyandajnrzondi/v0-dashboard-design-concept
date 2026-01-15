-- Create items table for storing image metadata
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read items
CREATE POLICY "Allow public read access to items" 
  ON items FOR SELECT 
  USING (true);

-- Allow anyone to insert items
CREATE POLICY "Allow public insert access to items" 
  ON items FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update items
CREATE POLICY "Allow public update access to items" 
  ON items FOR UPDATE 
  USING (true);

-- Allow anyone to delete items
CREATE POLICY "Allow public delete access to items" 
  ON items FOR DELETE 
  USING (true);

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
