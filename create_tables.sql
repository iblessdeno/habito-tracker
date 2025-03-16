-- Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  target_count INTEGER NOT NULL DEFAULT 1,
  reminder_time TIME,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create habit_logs table to track habit completion
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create habit_streaks table to track streaks
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_tracked_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for habits
CREATE POLICY "Users can view their own habits" 
  ON public.habits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" 
  ON public.habits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
  ON public.habits 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
  ON public.habits 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for habit_logs
CREATE POLICY "Users can view their own habit logs" 
  ON public.habit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habit logs" 
  ON public.habit_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit logs" 
  ON public.habit_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs" 
  ON public.habit_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for habit_streaks
CREATE POLICY "Users can view their own habit streaks" 
  ON public.habit_streaks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit streaks" 
  ON public.habit_streaks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habit streaks" 
  ON public.habit_streaks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit streaks" 
  ON public.habit_streaks 
  FOR DELETE 
  USING (auth.uid() = user_id);
