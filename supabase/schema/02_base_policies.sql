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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_id_idx ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS habit_streaks_user_id_idx ON public.habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS habit_streaks_habit_id_idx ON public.habit_streaks(habit_id);
