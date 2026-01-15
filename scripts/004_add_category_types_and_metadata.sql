-- Add category type to support different schemas
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- Expand items table to store rich metadata as JSONB
ALTER TABLE items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create workout_logs table for fitness tracking
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to workout_logs" 
  ON workout_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to workout_logs" 
  ON workout_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to workout_logs" 
  ON workout_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to workout_logs" 
  ON workout_logs FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_logs_category_id ON workout_logs(category_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(workout_date);
