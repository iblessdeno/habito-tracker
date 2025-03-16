-- Create reminders table for reminder features
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  message TEXT,
  time TIME NOT NULL,
  days_of_week TEXT[] NOT NULL, -- Array of days: ['monday', 'wednesday', 'friday']
  is_active BOOLEAN DEFAULT TRUE,
  notify_via VARCHAR(50) DEFAULT 'app', -- app, email, push
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own reminders
CREATE POLICY "Users can view their own reminders" 
  ON reminders FOR SELECT 
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own reminders
CREATE POLICY "Users can insert their own reminders" 
  ON reminders FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own reminders
CREATE POLICY "Users can update their own reminders" 
  ON reminders FOR UPDATE 
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own reminders
CREATE POLICY "Users can delete their own reminders" 
  ON reminders FOR DELETE 
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX reminders_user_id_idx ON reminders(user_id);
CREATE INDEX reminders_habit_id_idx ON reminders(habit_id);
CREATE INDEX reminders_is_active_idx ON reminders(is_active);
