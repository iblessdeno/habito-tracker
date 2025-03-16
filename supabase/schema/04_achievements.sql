-- Create achievements table for gamification
CREATE TABLE IF NOT EXISTS public.achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL, -- streak, completion, consistency, milestone, social
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
-- Users can only view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON public.achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own achievements
CREATE POLICY "Users can insert their own achievements"
  ON public.achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own achievements
CREATE POLICY "Users can update their own achievements"
  ON public.achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own achievements
CREATE POLICY "Users can delete their own achievements"
  ON public.achievements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_achieved_at ON public.achievements(achieved_at) WHERE achieved_at IS NOT NULL;

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION update_achievements_updated_at();
