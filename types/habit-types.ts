// Type definitions for Habito app

// User Profile
export interface Profile {
  id: string
  name: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Habit
export interface Habit {
  id: number
  user_id: string
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  color: string
  icon: string
  created_at: string
  updated_at: string
  archived: boolean
  archived_at?: string
}

// Habit Log
export interface HabitLog {
  id: number
  habit_id: number
  user_id: string
  completed_at: string
  notes?: string
  created_at: string
}

// Habit Streak
export interface HabitStreak {
  id: number
  habit_id: number
  user_id: string
  current_streak: number
  longest_streak: number
  last_tracked_date: string
  created_at: string
  updated_at: string
}

// Habit Template
export interface HabitTemplate {
  title: string;
  description: string;
  frequency: string;
  target_count: number;
  color: string;
  icon: string;
  category: string;
}

// Habit form values type
export interface HabitFormValues {
  title: string;
  description: string;
  frequency: string;
  target_count: number;
  color: string;
  icon: string;
}

// Reminder
export interface Reminder {
  id: number;
  user_id: string;
  habit_id: number;
  reminder_time: string; 
  days_of_week: string[]; 
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderFormValues {
  habit_id: number;
  reminder_time: string;
  days_of_week: string[];
  enabled: boolean;
}

// Achievement
export interface Achievement {
  id: number;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  achieved_at: string | null;
  progress: number;
  target: number;
  type: string; 
  created_at: string;
  updated_at: string;
}

// Social Share
export interface SocialShare {
  id: number;
  user_id: string;
  habit_id: number;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Social Comment
export interface SocialComment {
  id: number;
  share_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Social Like
export interface SocialLike {
  id: number;
  share_id: number;
  user_id: string;
  created_at: string;
}

// Friend
export interface Friend {
  id: number;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Form schemas for validation
export interface HabitFormValues {
  title: string
  description: string
  frequency: string
  target_count: number
  color: string
  icon: string
}

export interface ReminderFormValues {
  habit_id: number
  reminder_time: string
  days_of_week: string[]
  enabled: boolean
}

export interface ShareFormValues {
  habit_id: number
  content: string
  image_url?: string
  is_public: boolean
}

// Analytics types
export interface HabitStats {
  habit_id: number
  title: string
  total_completions: number
  completion_rate: number
  current_streak: number
  longest_streak: number
}

export interface CompletionTrend {
  date: string
  count: number
}

export interface HabitInsights {
  most_consistent_habit?: {
    habit_id: number
    title: string
    consistency: number
  }
  longest_streak?: {
    habit_id: number
    title: string
    streak: number
  }
  total_completions: number
  active_habits: number
  completion_trends: CompletionTrend[]
}
