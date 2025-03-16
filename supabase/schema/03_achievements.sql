-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    achieved_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'streak', 'completion', 'consistency', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own achievements
CREATE POLICY "Users can view their own achievements" 
ON public.achievements FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own achievements
CREATE POLICY "Users can insert their own achievements" 
ON public.achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own achievements
CREATE POLICY "Users can update their own achievements" 
ON public.achievements FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own achievements
CREATE POLICY "Users can delete their own achievements" 
ON public.achievements FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS achievements_type_idx ON public.achievements(type);
