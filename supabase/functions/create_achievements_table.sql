-- Create a stored procedure to create the user_achievements table if it doesn't exist
CREATE OR REPLACE FUNCTION create_achievements_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user_achievements table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_achievements'
  ) THEN
    -- Create the user_achievements table
    CREATE TABLE public.user_achievements (
      id SERIAL PRIMARY KEY,
      profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
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
    ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow users to view only their own achievements
    CREATE POLICY "Users can view their own achievements"
      ON public.user_achievements
      FOR SELECT
      USING (auth.uid() = profile_id);

    -- Create policy to allow users to insert their own achievements
    CREATE POLICY "Users can insert their own achievements"
      ON public.user_achievements
      FOR INSERT
      WITH CHECK (auth.uid() = profile_id);

    -- Create policy to allow users to update their own achievements
    CREATE POLICY "Users can update their own achievements"
      ON public.user_achievements
      FOR UPDATE
      USING (auth.uid() = profile_id);

    -- Create policy to allow users to delete their own achievements
    CREATE POLICY "Users can delete their own achievements"
      ON public.user_achievements
      FOR DELETE
      USING (auth.uid() = profile_id);
  END IF;
END;
$$;
