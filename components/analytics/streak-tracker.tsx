"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Flame, Calendar, Star } from 'lucide-react';
import { format, isSameDay, differenceInDays, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface StreakTrackerProps {
  habitId: number;
  logs: any[];
  streaks?: {
    current_streak: number;
    longest_streak: number;
    last_tracked_date: string;
  };
  color?: string;
}

export function StreakTracker({ 
  habitId, 
  logs, 
  streaks,
  color = 'hsl(var(--primary))' 
}: StreakTrackerProps) {
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestone, setMilestone] = useState(0);
  
  // Filter logs for the current habit
  const habitLogs = logs.filter(log => log.habit_id === habitId);
  
  // Sort logs by date (newest first)
  const sortedLogs = [...habitLogs].sort((a, b) => 
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  
  // Get current streak from streaks data or calculate it
  const currentStreak = streaks?.current_streak || calculateCurrentStreak();
  const longestStreak = streaks?.longest_streak || calculateLongestStreak();
  
  // Calculate current streak if not provided
  function calculateCurrentStreak() {
    if (sortedLogs.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    const mostRecentLog = new Date(sortedLogs[0].completed_at);
    
    // Check if the most recent log is from today or yesterday
    if (!isSameDay(mostRecentLog, today) && !isYesterday(mostRecentLog)) {
      return 0; // Streak broken
    }
    
    // Count consecutive days
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const currentDate = new Date(sortedLogs[i].completed_at);
      const nextDate = new Date(sortedLogs[i + 1].completed_at);
      
      // If dates are consecutive, increment streak
      if (differenceInDays(currentDate, nextDate) === 1) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  }
  
  // Calculate longest streak if not provided
  function calculateLongestStreak() {
    if (sortedLogs.length === 0) return 0;
    
    let currentStreak = 1;
    let maxStreak = 1;
    
    // Sort logs by date (oldest first)
    const chronologicalLogs = [...sortedLogs].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    
    for (let i = 0; i < chronologicalLogs.length - 1; i++) {
      const currentDate = new Date(chronologicalLogs[i].completed_at);
      const nextDate = new Date(chronologicalLogs[i + 1].completed_at);
      
      if (differenceInDays(nextDate, currentDate) === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }
  
  // Check for streak milestones
  useEffect(() => {
    // Milestone thresholds
    const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
    
    // Find the current milestone
    const achievedMilestone = milestones.find(m => currentStreak === m);
    
    if (achievedMilestone) {
      setMilestone(achievedMilestone);
      setShowMilestone(true);
      
      // Hide milestone notification after 5 seconds
      const timer = setTimeout(() => {
        setShowMilestone(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);
  
  // Get last completion date
  const lastCompletionDate = sortedLogs.length > 0 
    ? new Date(sortedLogs[0].completed_at) 
    : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Flame className="mr-2 h-5 w-5" style={{ color }} />
          Streak Tracking
        </CardTitle>
        {lastCompletionDate && (
          <CardDescription>
            Last completed: {format(lastCompletionDate, 'MMM d, yyyy')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-4 border rounded-md">
            <Flame className="h-8 w-8 mb-2" style={{ color }} />
            <span className="text-sm text-muted-foreground">Current Streak</span>
            <span className="text-3xl font-bold">{currentStreak}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-md">
            <Trophy className="h-8 w-8 mb-2" style={{ color }} />
            <span className="text-sm text-muted-foreground">Longest Streak</span>
            <span className="text-3xl font-bold">{longestStreak}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>
        
        {/* Milestone notification */}
        {showMilestone && (
          <div className="mt-4 p-3 bg-primary/10 rounded-md flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            <div>
              <p className="font-medium">Milestone reached!</p>
              <p className="text-sm text-muted-foreground">
                {milestone} day streak! Keep up the good work!
              </p>
            </div>
          </div>
        )}
        
        {/* Streak tips */}
        <div className="mt-4 text-sm text-muted-foreground">
          {currentStreak === 0 ? (
            <p>Complete this habit today to start a new streak!</p>
          ) : (
            <p>Don't break your streak! Complete this habit daily to keep it going.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
