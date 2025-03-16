'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { generateHabitColor } from '@/lib/utils';

interface HabitAnalyticsProps {
  habits: any[];
  habitLogs: Record<number, any[]>;
}

export function HabitAnalytics({ habits, habitLogs }: HabitAnalyticsProps) {
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topHabits, setTopHabits] = useState<any[]>([]);

  useEffect(() => {
    if (habits.length === 0) {
      setCompletionRate(0);
      setWeeklyData([]);
      setTopHabits([]);
      return;
    }

    // Calculate completion rate
    const totalHabits = habits.length;
    const completedHabits = habits.filter(habit => 
      habitLogs[habit.id]?.some(log => 
        isSameDay(new Date(log.completed_at), new Date())
      )
    ).length;
    
    const rate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
    setCompletionRate(Math.round(rate));

    // Generate weekly data
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });

    const weekData = last7Days.map(day => {
      const dayStr = format(day, 'EEE');
      const completedCount = habits.filter(habit => 
        habitLogs[habit.id]?.some(log => 
          isSameDay(new Date(log.completed_at), day)
        )
      ).length;
      
      const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
      
      return {
        day: dayStr,
        date: format(day, 'yyyy-MM-dd'),
        count: completedCount,
        percentage,
        isToday: isSameDay(day, today)
      };
    });
    
    setWeeklyData(weekData);

    // Calculate top habits
    const habitCompletions = habits.map(habit => {
      const logs = habitLogs[habit.id] || [];
      return {
        id: habit.id,
        title: habit.title,
        color: habit.color || generateHabitColor(habit.title),
        completions: logs.length
      };
    });
    
    const sortedHabits = [...habitCompletions].sort((a, b) => b.completions - a.completions);
    setTopHabits(sortedHabits.slice(0, 3));
  }, [habits, habitLogs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Completion Rate */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Today's Completion</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    {completionRate}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div 
                  style={{ width: `${completionRate}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                ></div>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Weekly Progress</h3>
            <div className="flex justify-between items-end h-24">
              {weeklyData.map((item) => (
                <div key={item.date} className="flex flex-col items-center">
                  <div 
                    className={`w-6 rounded-t-sm ${
                      item.isToday ? 'bg-indigo-600' : 'bg-indigo-400'
                    }`}
                    style={{ height: `${Math.max(4, item.percentage)}%` }}
                  ></div>
                  <span className="text-xs mt-1 font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Habits */}
          {topHabits.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Top Habits</h3>
              <div className="space-y-2">
                {topHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: habit.color }}
                      ></div>
                      <span className="text-sm">{habit.title}</span>
                    </div>
                    <span className="text-sm font-medium">{habit.completions} logs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
