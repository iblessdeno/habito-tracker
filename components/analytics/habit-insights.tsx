"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Calendar, Clock, TrendingUp, Award } from 'lucide-react';
import { 
  format, 
  parseISO, 
  getDay, 
  getHours, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval 
} from 'date-fns';

interface HabitInsightsProps {
  habitId: number;
  logs: any[];
  color?: string;
}

export function HabitInsights({ habitId, logs, color = 'hsl(var(--primary))' }: HabitInsightsProps) {
  // Filter logs for the current habit
  const habitLogs = logs.filter(log => log.habit_id === habitId);
  
  // Calculate insights
  const insights = useMemo(() => {
    if (habitLogs.length === 0) {
      return {
        bestDay: null,
        bestTime: null,
        completionRate: 0,
        consistency: 0,
        longestStreak: 0
      };
    }
    
    // Count completions by day of week
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    
    // Count completions by hour of day
    const hourCompletions = Array(24).fill(0);
    
    // Process each log
    habitLogs.forEach(log => {
      const date = parseISO(log.completed_at);
      const day = getDay(date);
      const hour = getHours(date);
      
      dayCompletions[day]++;
      hourCompletions[hour]++;
    });
    
    // Find best day
    const bestDayIndex = dayCompletions.indexOf(Math.max(...dayCompletions));
    const bestDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestDayIndex];
    
    // Find best time
    const bestHourIndex = hourCompletions.indexOf(Math.max(...hourCompletions));
    const bestTime = format(new Date().setHours(bestHourIndex, 0, 0, 0), 'h a');
    
    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = habitLogs.filter(log => 
      new Date(log.completed_at) >= thirtyDaysAgo
    );
    
    const completionRate = Math.round((recentLogs.length / 30) * 100);
    
    // Calculate consistency (standard deviation of days between completions)
    let consistency = 0;
    if (habitLogs.length > 1) {
      const sortedLogs = [...habitLogs].sort((a, b) => 
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );
      
      const intervals = [];
      for (let i = 0; i < sortedLogs.length - 1; i++) {
        const current = new Date(sortedLogs[i].completed_at);
        const next = new Date(sortedLogs[i + 1].completed_at);
        const days = Math.round((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(days);
      }
      
      if (intervals.length > 0) {
        const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const squareDiffs = intervals.map(val => Math.pow(val - mean, 2));
        const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / intervals.length;
        consistency = Math.round(100 - Math.min(100, Math.sqrt(variance) * 10));
      }
    }
    
    return {
      bestDay,
      bestTime,
      completionRate,
      consistency,
      longestStreak: calculateLongestStreak(habitLogs)
    };
  }, [habitLogs]);
  
  // Calculate longest streak
  function calculateLongestStreak(logs: any[]) {
    if (logs.length === 0) return 0;
    
    // Sort logs by date (oldest first)
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const currentDate = new Date(sortedLogs[i].completed_at);
      const nextDate = new Date(sortedLogs[i + 1].completed_at);
      
      // Check if dates are consecutive
      const diffDays = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }
  
  // Generate personalized insights
  const getPersonalizedInsight = () => {
    if (habitLogs.length < 5) {
      return "Keep tracking this habit to see personalized insights!";
    }
    
    // Define insights object first
    const insightData = {
      bestDay: getBestDay(),
      bestTime: getBestTime(),
      consistency: calculateConsistency(),
      completionRate: calculateCompletionRate(),
      longestStreak: getLongestStreak()
    };
    
    const insights = [
      insightData.bestDay && `You're most consistent on ${insightData.bestDay}s.`,
      insightData.bestTime && `You tend to complete this habit around ${insightData.bestTime}.`,
      insightData.consistency > 80 && "You're very consistent with this habit!",
      insightData.consistency < 50 && "Try to be more consistent with this habit.",
      insightData.completionRate > 80 && "Great job maintaining this habit!",
      insightData.completionRate < 30 && "You might need more reminders for this habit.",
      insightData.longestStreak > 7 && `Your longest streak was ${insightData.longestStreak} days!`
    ].filter(Boolean);
    
    return insights[Math.floor(Math.random() * insights.length)] || 
      "Keep going with this habit to build a strong routine!";
  }
  
  // Helper functions for getPersonalizedInsight
  const getBestDay = () => {
    return insights.bestDay;
  }
  
  const getBestTime = () => {
    return insights.bestTime;
  }
  
  const calculateConsistency = () => {
    return insights.consistency;
  }
  
  const calculateCompletionRate = () => {
    return insights.completionRate;
  }
  
  const getLongestStreak = () => {
    return insights.longestStreak;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" style={{ color }} />
          Habit Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main insight */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{getPersonalizedInsight()}</p>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col p-3 border rounded-md">
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                Best Day
              </div>
              <div className="font-medium">
                {insights.bestDay || 'Not enough data'}
              </div>
            </div>
            
            <div className="flex flex-col p-3 border rounded-md">
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4 mr-1" />
                Best Time
              </div>
              <div className="font-medium">
                {insights.bestTime || 'Not enough data'}
              </div>
            </div>
            
            <div className="flex flex-col p-3 border rounded-md">
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                Consistency
              </div>
              <div className="font-medium">
                {insights.consistency}%
              </div>
            </div>
            
            <div className="flex flex-col p-3 border rounded-md">
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Award className="h-4 w-4 mr-1" />
                Completion Rate
              </div>
              <div className="font-medium">
                {insights.completionRate}%
              </div>
            </div>
          </div>
          
          {/* Tip */}
          <div className="text-xs text-muted-foreground">
            <p>Tip: Habits are most effective when done at the same time each day.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
