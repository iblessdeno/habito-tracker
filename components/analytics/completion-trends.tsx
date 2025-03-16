"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  subWeeks,
  subMonths
} from 'date-fns';

interface CompletionTrendsProps {
  habitId: number;
  logs: any[];
  color?: string;
}

export function CompletionTrends({ habitId, logs, color = 'hsl(var(--primary))' }: CompletionTrendsProps) {
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Filter logs for the current habit
  const habitLogs = logs.filter(log => log.habit_id === habitId);
  
  // Get dates for current week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Get dates for current month
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get dates for previous week
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
  const daysInPrevWeek = eachDayOfInterval({ start: prevWeekStart, end: prevWeekEnd });
  
  // Get dates for previous month
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const daysInPrevMonth = eachDayOfInterval({ start: prevMonthStart, end: prevMonthEnd });
  
  // Check if a date has a completion
  const isDateCompleted = (date: Date) => {
    return habitLogs.some(log => isSameDay(new Date(log.completed_at), date));
  };
  
  // Calculate completion rate
  const calculateCompletionRate = (days: Date[]) => {
    const completedDays = days.filter(day => isDateCompleted(day)).length;
    return days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;
  };
  
  // Current week/month completion rates
  const currentWeekRate = calculateCompletionRate(daysInWeek);
  const currentMonthRate = calculateCompletionRate(daysInMonth);
  
  // Previous week/month completion rates
  const prevWeekRate = calculateCompletionRate(daysInPrevWeek);
  const prevMonthRate = calculateCompletionRate(daysInPrevMonth);
  
  // Calculate trend (positive or negative)
  const weeklyTrend = currentWeekRate - prevWeekRate;
  const monthlyTrend = currentMonthRate - prevMonthRate;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="pt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{currentWeekRate}%</span>
                  {weeklyTrend !== 0 && (
                    <span className={`ml-2 text-xs ${weeklyTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {weeklyTrend > 0 ? '+' : ''}{weeklyTrend}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {daysInWeek.map((day, i) => {
                  const completed = isDateCompleted(day);
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          completed ? 'text-white' : 'bg-muted'
                        }`}
                        style={completed ? { backgroundColor: color } : {}}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {weeklyTrend > 0 
                  ? 'You\'re doing better than last week!' 
                  : weeklyTrend < 0 
                    ? 'Try to improve from last week' 
                    : 'Maintaining the same consistency as last week'}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="pt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{currentMonthRate}%</span>
                  {monthlyTrend !== 0 && (
                    <span className={`ml-2 text-xs ${monthlyTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthlyTrend > 0 ? '+' : ''}{monthlyTrend}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 max-h-[200px] overflow-y-auto">
                {daysInMonth.map((day, i) => {
                  const completed = isDateCompleted(day);
                  return (
                    <div key={i} className="flex flex-col items-center mb-1">
                      {i < 7 && (
                        <div className="text-xs text-muted-foreground mb-1">
                          {format(day, 'EEE')}
                        </div>
                      )}
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          completed ? 'text-white' : 'bg-muted'
                        }`}
                        style={completed ? { backgroundColor: color } : {}}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {monthlyTrend > 0 
                  ? 'Great improvement from last month!' 
                  : monthlyTrend < 0 
                    ? 'Try to improve from last month' 
                    : 'Maintaining the same consistency as last month'}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
