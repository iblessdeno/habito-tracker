-- Create friends table for social features
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Add RLS policies for friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own friend connections
CREATE POLICY "Users can view their own friend connections" 
  ON friends FOR SELECT 
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Policy to allow users to insert friend requests
CREATE POLICY "Users can insert friend requests" 
  ON friends FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own friend connections
CREATE POLICY "Users can update their own friend connections" 
  ON friends FOR UPDATE 
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Policy to allow users to delete their own friend connections
CREATE POLICY "Users can delete their own friend connections" 
  ON friends FOR DELETE 
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Create index for faster queries
CREATE INDEX friends_user_id_idx ON friends(user_id);
CREATE INDEX friends_friend_id_idx ON friends(friend_id);
CREATE INDEX friends_status_idx ON friends(status);
