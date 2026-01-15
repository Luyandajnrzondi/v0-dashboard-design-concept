-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dashboard-images', 'dashboard-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Allow public read access to images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dashboard-images');

-- Allow public upload access to images
CREATE POLICY "Allow public upload access to images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dashboard-images');

-- Allow public update access to images
CREATE POLICY "Allow public update access to images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'dashboard-images');

-- Allow public delete access to images
CREATE POLICY "Allow public delete access to images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dashboard-images');
