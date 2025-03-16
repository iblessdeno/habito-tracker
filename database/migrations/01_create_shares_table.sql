-- Create shares table for social features
CREATE TABLE IF NOT EXISTS shares (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  share_type VARCHAR(20) DEFAULT 'feed',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view public shares
CREATE POLICY "Anyone can view public shares" 
  ON shares FOR SELECT 
  USING (is_public = true);

-- Policy to allow users to view their own shares
CREATE POLICY "Users can view their own shares" 
  ON shares FOR SELECT 
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own shares
CREATE POLICY "Users can insert their own shares" 
  ON shares FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own shares
CREATE POLICY "Users can update their own shares" 
  ON shares FOR UPDATE 
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own shares
CREATE POLICY "Users can delete their own shares" 
  ON shares FOR DELETE 
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX shares_user_id_idx ON shares(user_id);
CREATE INDEX shares_habit_id_idx ON shares(habit_id);
CREATE INDEX shares_created_at_idx ON shares(created_at DESC);
