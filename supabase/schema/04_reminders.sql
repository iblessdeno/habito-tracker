-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    days_of_week VARCHAR(7), -- e.g., '1,2,3,4,5' for weekdays
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own reminders
CREATE POLICY "Users can view their own reminders" 
ON public.reminders FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own reminders
CREATE POLICY "Users can insert their own reminders" 
ON public.reminders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own reminders
CREATE POLICY "Users can update their own reminders" 
ON public.reminders FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own reminders
CREATE POLICY "Users can delete their own reminders" 
ON public.reminders FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_habit_id_idx ON public.reminders(habit_id);
