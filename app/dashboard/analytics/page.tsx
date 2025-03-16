"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CustomCalendar } from '@/components/custom-calendar';
import { CompletionTrends } from '@/components/analytics/completion-trends';
import { StreakTracker } from '@/components/analytics/streak-tracker';
import { HabitInsights } from '@/components/analytics/habit-insights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart2, Calendar, ArrowLeft } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  format,
  isWithinInterval,
  subDays
} from 'date-fns';

export default function AnalyticsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUserId(user.id);
      await fetchHabits(user.id);
    };
    
    fetchUserData();
  }, [router]);
  
  // Fetch habits
  const fetchHabits = async (userId: string) => {
    try {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setHabits(habits || []);
      
      if (habits && habits.length > 0) {
        setSelectedHabit(habits[0].id);
        await Promise.all([
          fetchLogs(userId),
          fetchStreaks(userId)
        ]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching habits:', error);
      setLoading(false);
    }
  };
  
  // Fetch habit logs
  const fetchLogs = async (userId: string) => {
    try {
      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setLogs(logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };
  
  // Fetch habit streaks
  const fetchStreaks = async (userId: string) => {
    try {
      const { data: streaks, error } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setStreaks(streaks || []);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };
  
  // Get completed dates for selected habit
  const getCompletedDates = () => {
    if (!selectedHabit) return [];
    
    return logs
      .filter(log => log.habit_id === selectedHabit)
      .map(log => new Date(log.completed_at));
  };
  
  // Get streak data for the calendar
  const getStreakData = () => {
    if (!selectedHabit) return [];
    
    const habitStreak = streaks.find(streak => streak.habit_id === selectedHabit);
    if (!habitStreak) return [];
    
    // Get habit logs for this habit
    const habitLogs = logs.filter(log => log.habit_id === selectedHabit);
    
    // Sort logs by date (newest first)
    const sortedLogs = [...habitLogs].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    // Create streak data for the calendar
    const streakData = [];
    let currentStreak = habitStreak.current_streak;
    
    for (let i = 0; i < sortedLogs.length && currentStreak > 0; i++) {
      const date = new Date(sortedLogs[i].completed_at);
      streakData.push({
        date,
        count: currentStreak
      });
      currentStreak--;
    }
    
    return streakData;
  };
  
  // Get missed dates (days when the habit should have been done but wasn't)
  const getMissedDates = () => {
    if (!selectedHabit) return [];
    
    const habit = habits.find(h => h.id === selectedHabit);
    if (!habit) return [];
    
    // Only calculate missed dates for daily habits
    if (habit.frequency !== 'daily') return [];
    
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    const completedDates = getCompletedDates();
    
    // Find dates in the range that don't have completions
    return dateRange.filter(date => 
      !completedDates.some(completedDate => isSameDay(completedDate, date)) &&
      date < today // Don't count today as missed yet
    );
  };
  
  // Get habit color
  const getHabitColor = () => {
    if (!selectedHabit) return '#0ea5e9';
    
    const habit = habits.find(h => h.id === selectedHabit);
    return habit?.color || '#0ea5e9';
  };
  
  // Get streak data for the selected habit
  const getHabitStreak = () => {
    if (!selectedHabit) return null;
    
    return streaks.find(streak => streak.habit_id === selectedHabit);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/dashboard')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Habit Analytics</h1>
      </div>
      
      {habits.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No habits found</h2>
          <p className="text-muted-foreground mb-4">
            Create habits to track your progress and see analytics
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {/* Habit selector */}
          <div className="mb-6">
            <Select
              value={selectedHabit?.toString() || ''}
              onValueChange={(value) => setSelectedHabit(Number(value))}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a habit" />
              </SelectTrigger>
              <SelectContent>
                {habits.map((habit) => (
                  <SelectItem key={habit.id} value={habit.id.toString()}>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: habit.color || '#0ea5e9' }}
                      />
                      {habit.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Habit Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CustomCalendar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        completedDates={getCompletedDates()}
                        completionColor={getHabitColor()}
                        streaks={getStreakData()}
                        missedDates={getMissedDates()}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <StreakTracker
                    habitId={selectedHabit || 0}
                    logs={logs}
                    streaks={getHabitStreak()}
                    color={getHabitColor()}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CompletionTrends
                  habitId={selectedHabit || 0}
                  logs={logs}
                  color={getHabitColor()}
                />
                
                <HabitInsights
                  habitId={selectedHabit || 0}
                  logs={logs}
                  color={getHabitColor()}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
