-- Create habit_reminders table
CREATE TABLE IF NOT EXISTS habit_reminders (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  days INTEGER[] NOT NULL, -- Array of days (0 = Sunday, 1 = Monday, etc.)
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE habit_reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting reminders
CREATE POLICY select_own_reminders ON habit_reminders
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for inserting reminders
CREATE POLICY insert_own_reminders ON habit_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for updating reminders
CREATE POLICY update_own_reminders ON habit_reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for deleting reminders
CREATE POLICY delete_own_reminders ON habit_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_habit_reminders_updated_at
BEFORE UPDATE ON habit_reminders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add index for faster queries
CREATE INDEX habit_reminders_habit_id_idx ON habit_reminders(habit_id);
CREATE INDEX habit_reminders_user_id_idx ON habit_reminders(user_id);
