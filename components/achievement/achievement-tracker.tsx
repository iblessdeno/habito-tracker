'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';

// Define achievement types
const ACHIEVEMENT_TYPES = {
  STREAK: 'streak',
  COMPLETION: 'completion',
  CONSISTENCY: 'consistency',
  MILESTONE: 'milestone',
  SOCIAL: 'social'
};

// Define achievement templates
const ACHIEVEMENT_TEMPLATES = [
  // Streak Achievements
  {
    name: 'Streak Starter',
    description: 'Maintain a habit for 3 consecutive days',
    type: ACHIEVEMENT_TYPES.STREAK,
    target: 3,
    icon: '🔥'
  },
  {
    name: 'Streak Pro',
    description: 'Maintain a habit for 7 consecutive days',
    type: ACHIEVEMENT_TYPES.STREAK,
    target: 7,
    icon: '🔥'
  },
  {
    name: 'Streak Master',
    description: 'Maintain a habit for 30 consecutive days',
    type: ACHIEVEMENT_TYPES.STREAK,
    target: 30,
    icon: '🔥'
  },
  {
    name: 'Streak Champion',
    description: 'Maintain a habit for 100 consecutive days',
    type: ACHIEVEMENT_TYPES.STREAK,
    target: 100,
    icon: '🏆'
  },
  
  // Completion Achievements
  {
    name: 'Habit Rookie',
    description: 'Complete a habit 10 times',
    type: ACHIEVEMENT_TYPES.COMPLETION,
    target: 10,
    icon: '🌱'
  },
  {
    name: 'Habit Hero',
    description: 'Complete a habit 50 times',
    type: ACHIEVEMENT_TYPES.COMPLETION,
    target: 50,
    icon: '🌿'
  },
  {
    name: 'Habit Legend',
    description: 'Complete a habit 100 times',
    type: ACHIEVEMENT_TYPES.COMPLETION,
    target: 100,
    icon: '🌳'
  },
  
  // Consistency Achievements
  {
    name: 'Daily Dynamo',
    description: 'Complete all habits for one day',
    type: ACHIEVEMENT_TYPES.CONSISTENCY,
    target: 1,
    icon: '📅'
  },
  {
    name: 'Weekly Warrior',
    description: 'Complete all habits for a week',
    type: ACHIEVEMENT_TYPES.CONSISTENCY,
    target: 7,
    icon: '📆'
  },
  {
    name: 'Monthly Master',
    description: 'Complete all habits for a month',
    type: ACHIEVEMENT_TYPES.CONSISTENCY,
    target: 30,
    icon: '📊'
  },
  
  // Milestone Achievements
  {
    name: 'First Step',
    description: 'Create your first habit',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    target: 1,
    icon: '👣'
  },
  {
    name: 'Habit Collector',
    description: 'Create 5 different habits',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    target: 5,
    icon: '🧩'
  },
  {
    name: 'Habit Veteran',
    description: 'Use Habito for 30 days',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    target: 30,
    icon: '🎖️'
  },
  
  // Social Achievements
  {
    name: 'Social Butterfly',
    description: 'Invite 3 friends to Habito',
    type: ACHIEVEMENT_TYPES.SOCIAL,
    target: 3,
    icon: '🦋'
  },
  {
    name: 'Challenge Champion',
    description: 'Complete a group challenge',
    type: ACHIEVEMENT_TYPES.SOCIAL,
    target: 1,
    icon: '🏅'
  }
];

interface AchievementTrackerProps {
  userId: string;
  habits?: any[];
  habitLogs?: any[];
  habitStreaks?: any[];
  onAchievementUnlocked?: (achievement: any) => void;
}

export function AchievementTracker({ 
  userId, 
  habits = [], 
  habitLogs = [], 
  habitStreaks = [],
  onAchievementUnlocked 
}: AchievementTrackerProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  useEffect(() => {
    const initializeAchievements = async () => {
      try {
        // First, check if the user_achievements table exists
        const { data: tableInfo, error: tableError } = await supabase
          .from('user_achievements')
          .select('id')
          .limit(1);
          
        if (tableError) {
          console.error('Error checking achievements table:', tableError);
          // Table doesn't exist, create it
          const { error: createTableError } = await supabase.rpc('create_achievements_table');
          
          if (createTableError) {
            console.error('Error creating achievements table:', createTableError);
            return;
          }
        }
        
        // Check if user has achievements initialized
        const { data: existingAchievements, error: fetchError } = await supabase
          .from('user_achievements')
          .select('id, name, type')
          .eq('profile_id', userId);
          
        if (fetchError) {
          console.error('Error initializing achievements:', fetchError);
          return;
        }
        
        // If no achievements found, initialize them
        if (!existingAchievements || existingAchievements.length === 0) {
          const achievementsToInsert = ACHIEVEMENT_TEMPLATES.map(template => ({
            profile_id: userId,
            name: template.name,
            description: template.description,
            icon: template.icon,
            progress: 0,
            target: template.target,
            type: template.type,
            achieved_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('user_achievements')
            .insert(achievementsToInsert);
            
          if (insertError) {
            console.error('Error inserting achievements:', insertError);
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing achievements:', error);
      }
    };
    
    if (userId) {
      initializeAchievements();
    }
  }, [userId]);
  
  useEffect(() => {
    const trackAchievements = async () => {
      if (!userId || habits.length === 0) return;
      
      try {
        // Fetch current achievements
        const { data: achievements, error: fetchError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('profile_id', userId);
          
        if (fetchError) {
          console.error('Error tracking achievements:', fetchError);
          return;
        }
        
        if (!achievements) return;
        
        const updatedAchievements = [];
        const newlyUnlockedAchievements = [];
        
        // Track Milestone Achievements
        const firstStepAchievement = achievements.find(a => a.name === 'First Step');
        if (firstStepAchievement && habits.length > 0 && firstStepAchievement.progress < 1) {
          firstStepAchievement.progress = 1;
          
          if (firstStepAchievement.progress >= firstStepAchievement.target && !firstStepAchievement.achieved_at) {
            firstStepAchievement.achieved_at = new Date().toISOString();
            newlyUnlockedAchievements.push(firstStepAchievement);
          }
          
          updatedAchievements.push(firstStepAchievement);
        }
        
        const habitCollectorAchievement = achievements.find(a => a.name === 'Habit Collector');
        if (habitCollectorAchievement) {
          habitCollectorAchievement.progress = habits.length;
          
          if (habitCollectorAchievement.progress >= habitCollectorAchievement.target && !habitCollectorAchievement.achieved_at) {
            habitCollectorAchievement.achieved_at = new Date().toISOString();
            newlyUnlockedAchievements.push(habitCollectorAchievement);
          }
          
          updatedAchievements.push(habitCollectorAchievement);
        }
        
        // Track Streak Achievements
        const streakAchievements = achievements.filter(a => a.type === ACHIEVEMENT_TYPES.STREAK);
        
        habitStreaks.forEach(streak => {
          if (streak.current_streak > 0) {
            streakAchievements.forEach(achievement => {
              if (streak.current_streak >= achievement.target && !achievement.achieved_at) {
                achievement.progress = streak.current_streak;
                achievement.achieved_at = new Date().toISOString();
                updatedAchievements.push(achievement);
                newlyUnlockedAchievements.push(achievement);
              } else if (streak.current_streak > achievement.progress) {
                achievement.progress = streak.current_streak;
                updatedAchievements.push(achievement);
              }
            });
          }
        });
        
        // Track Completion Achievements
        const completionAchievements = achievements.filter(a => a.type === ACHIEVEMENT_TYPES.COMPLETION);
        
        habits.forEach(habit => {
          const habitCompletions = habitLogs.filter(log => log.habit_id === habit.id).length;
          
          completionAchievements.forEach(achievement => {
            if (habitCompletions >= achievement.target && !achievement.achieved_at) {
              achievement.progress = habitCompletions;
              achievement.achieved_at = new Date().toISOString();
              updatedAchievements.push(achievement);
              newlyUnlockedAchievements.push(achievement);
            } else if (habitCompletions > achievement.progress) {
              achievement.progress = habitCompletions;
              updatedAchievements.push(achievement);
            }
          });
        });
        
        // Update achievements in database
        if (updatedAchievements.length > 0) {
          for (const achievement of updatedAchievements) {
            const { error: updateError } = await supabase
              .from('user_achievements')
              .update({
                progress: achievement.progress,
                achieved_at: achievement.achieved_at,
                updated_at: new Date().toISOString()
              })
              .eq('id', achievement.id);
              
            if (updateError) {
              console.error('Error updating achievement:', updateError);
            }
          }
        }
        
        // Show toast notifications for newly unlocked achievements
        newlyUnlockedAchievements.forEach(achievement => {
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `${achievement.name}: ${achievement.description}`,
            duration: 5000,
          });
          
          if (onAchievementUnlocked) {
            onAchievementUnlocked(achievement);
          }
        });
        
      } catch (error) {
        console.error('Error tracking achievements:', error);
      }
    };
    
    trackAchievements();
  }, [userId, habits, habitLogs, habitStreaks]);
  
  // This component doesn't render anything visible
  return null;
}
