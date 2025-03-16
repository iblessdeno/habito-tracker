-- Create achievements table for gamification features
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL, -- streak, completion, consistency, etc.
  threshold INTEGER NOT NULL, -- value needed to earn the achievement
  badge_color VARCHAR(50) DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table to track user progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Add RLS policies for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to view achievements
CREATE POLICY "Anyone can view achievements" 
  ON achievements FOR SELECT 
  USING (true);

-- Policy to allow users to view their own achievement progress
CREATE POLICY "Users can view their own achievement progress" 
  ON user_achievements FOR SELECT 
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own achievement progress
CREATE POLICY "Users can insert their own achievement progress" 
  ON user_achievements FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own achievement progress
CREATE POLICY "Users can update their own achievement progress" 
  ON user_achievements FOR UPDATE 
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX user_achievements_achievement_id_idx ON user_achievements(achievement_id);
CREATE INDEX user_achievements_completed_idx ON user_achievements(completed);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, type, threshold, badge_color) VALUES
('Habit Starter', 'Create your first habit', 'Star', 'creation', 1, 'default'),
('Consistent Tracker', 'Log habits for 7 consecutive days', 'CheckCircle2', 'streak', 7, 'info'),
('Habit Master', 'Complete a habit 30 times', 'Award', 'completion', 30, 'success'),
('Streak Champion', 'Maintain a 14-day streak on any habit', 'TrendingUp', 'streak', 14, 'warning'),
('Achievement Hunter', 'Earn 5 different achievements', 'Trophy', 'meta', 5, 'secondary'),
('Time Manager', 'Set up reminders for 3 different habits', 'Clock', 'reminders', 3, 'default');
