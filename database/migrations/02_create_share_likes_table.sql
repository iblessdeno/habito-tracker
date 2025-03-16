-- Create share_likes table for social features
CREATE TABLE IF NOT EXISTS share_likes (
  id SERIAL PRIMARY KEY,
  share_id INTEGER NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(share_id, user_id)
);

-- Add RLS policies for share_likes
ALTER TABLE share_likes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all likes
CREATE POLICY "Anyone can view likes" 
  ON share_likes FOR SELECT 
  USING (true);

-- Policy to allow users to insert their own likes
CREATE POLICY "Users can insert their own likes" 
  ON share_likes FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to delete their own likes
CREATE POLICY "Users can delete their own likes" 
  ON share_likes FOR DELETE 
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX share_likes_share_id_idx ON share_likes(share_id);
CREATE INDEX share_likes_user_id_idx ON share_likes(user_id);
