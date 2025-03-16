'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { HabitCard } from '@/components/habit/habit-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, BarChart2, ChevronLeft, ChevronRight, TrendingUp, Activity, Award } from 'lucide-react';
import { format, isSameDay, startOfWeek, addDays, subDays, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart } from '@/components/ui/charts';

// Custom UI components
import { Progress } from '../../components/ui/progress';

export default function DashboardPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [completionRate, setCompletionRate] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await fetchHabits(user.id);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (habits.length > 0 && logs.length > 0) {
      calculateCompletionRate();
      generateWeeklyData();
      generateCategoryData();
      generateStreakData();
    }
  }, [habits, logs, selectedDate]);

  const fetchHabits = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Use Promise.all to parallelize data fetching
      const [habitsResponse, streaksResponse, logsResponse] = await Promise.all([
        // Fetch habits
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
          
        // Fetch streaks
        supabase
          .from('habit_streaks')
          .select('*')
          .eq('user_id', userId),
          
        // Fetch logs - optimize by fetching only recent logs (last 30 days)
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (habitsResponse.error) throw habitsResponse.error;
      if (streaksResponse.error) throw streaksResponse.error;
      if (logsResponse.error) throw logsResponse.error;
      
      setHabits(habitsResponse.data || []);
      setStreaks(streaksResponse.data || []);
      setLogs(logsResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching habits data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteHabit = async (habitId: number) => {
    if (!user) return;

    try {
      // Check if already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isCompletedToday = logs.some(log => 
        log.habit_id === habitId && 
        new Date(log.completed_at).setHours(0, 0, 0, 0) === today.getTime()
      );

      if (isCompletedToday) {
        // Delete the log for today
        const logToDelete = logs.find(log => 
          log.habit_id === habitId && 
          new Date(log.completed_at).setHours(0, 0, 0, 0) === today.getTime()
        );

        if (logToDelete) {
          const { error } = await supabase
            .from('habit_logs')
            .delete()
            .eq('id', logToDelete.id);

          if (error) throw error;
        }
      } else {
        // Add new log
        const { error } = await supabase
          .from('habit_logs')
          .insert([
            { 
              habit_id: habitId, 
              user_id: user.id,
              completed_at: new Date().toISOString(),
            }
          ]);

        if (error) throw error;
      }

      // Refetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id);

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Update streaks
      await updateStreaks(habitId, user.id);
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const updateStreaks = async (habitId: number, userId: string) => {
    try {
      // This is a simplified version - in a real app, you'd calculate streaks more carefully
      const habitLogs = logs.filter(log => log.habit_id === habitId);
      
      // Sort logs by date
      habitLogs.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
      
      let currentStreak = 0;
      let lastDate: Date | null = null;
      
      // Calculate current streak
      for (const log of habitLogs) {
        const logDate = new Date(log.completed_at);
        logDate.setHours(0, 0, 0, 0);
        
        if (!lastDate) {
          // First log
          lastDate = logDate;
          currentStreak = 1;
        } else {
          const dayDiff = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            // Consecutive day
            currentStreak++;
            lastDate = logDate;
          } else {
            break;
          }
        }
      }
      
      // Get existing streak
      const { data: existingStreak } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single();
      
      if (existingStreak) {
        // Update existing streak
        const longestStreak = Math.max(existingStreak.longest_streak, currentStreak);
        
        await supabase
          .from('habit_streaks')
          .update({ 
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_tracked_date: new Date().toISOString()
          })
          .eq('id', existingStreak.id);
      } else {
        // Create new streak
        await supabase
          .from('habit_streaks')
          .insert([
            { 
              habit_id: habitId,
              user_id: userId,
              current_streak: currentStreak,
              longest_streak: currentStreak,
              last_tracked_date: new Date().toISOString()
            }
          ]);
      }
      
      // Refetch streaks
      const { data: streaksData } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', userId);
      
      setStreaks(streaksData || []);
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  };

  const calculateCompletionRate = () => {
    if (habits.length === 0) {
      setCompletionRate(0);
      return;
    }

    const totalHabits = habits.length;
    const completedHabits = habits.filter(habit => {
      return logs.some(log => 
        log.habit_id === habit.id && 
        isSameDay(new Date(log.completed_at), selectedDate)
      );
    }).length;

    const rate = Math.round((completedHabits / totalHabits) * 100);
    setCompletionRate(rate);
  };

  const generateWeeklyData = () => {
    // Generate data for the past 7 days
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM dd');
      
      // Count completed habits for this day
      const completedCount = logs.filter(log => 
        isSameDay(new Date(log.completed_at), date)
      ).length;
      
      data.push({
        date: dateStr,
        count: completedCount
      });
    }
    
    setWeeklyData(data);
  };
  
  const generateCategoryData = () => {
    // Simple categorization based on habit title/description
    const categories: Record<string, number> = {
      'Health': 0,
      'Productivity': 0,
      'Learning': 0,
      'Other': 0
    };
    
    habits.forEach(habit => {
      const text = (habit.title + ' ' + (habit.description || '')).toLowerCase();
      
      if (text.includes('exercise') || text.includes('workout') || text.includes('health') || text.includes('sleep')) {
        categories['Health']++;
      } else if (text.includes('work') || text.includes('study') || text.includes('task') || text.includes('project')) {
        categories['Productivity']++;
      } else if (text.includes('read') || text.includes('learn') || text.includes('practice') || text.includes('course')) {
        categories['Learning']++;
      } else {
        categories['Other']++;
      }
    });
    
    const data = Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
    
    setCategoryData(data);
  };
  
  const generateStreakData = () => {
    // Generate data for top 5 habits by streak
    const data = streaks
      .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
      .slice(0, 5)
      .map(streak => {
        const habit = habits.find(h => h.id === streak.habit_id);
        return {
          name: habit ? habit.title : 'Unknown',
          value: streak.current_streak || 0
        };
      });
    
    setStreakData(data);
  };

  // Generate dates for the day selector
  const getDates = () => {
    const dates = [];
    const today = new Date();
    
    // Add 3 days before today
    for (let i = 3; i > 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    // Add today
    dates.push(today);
    
    // Add 3 days after today
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const dates = getDates();

  const getTopHabit = () => {
    if (habits.length === 0 || streaks.length === 0) return null;
    
    // Find habit with highest current streak
    const topStreakId = streaks.reduce(
      (maxId, streak) => {
        if (!maxId.streak || streak.current_streak > maxId.streak) {
          return { id: streak.habit_id, streak: streak.current_streak };
        }
        return maxId;
      },
      { id: null, streak: 0 }
    ).id;
    
    if (!topStreakId) return null;
    
    return habits.find(h => h.id === topStreakId);
  };

  const topHabit = getTopHabit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Habits</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/dashboard/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/dashboard/stats">
              <BarChart2 className="mr-2 h-4 w-4" />
              Statistics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/new-habit">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Habit</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Day selector */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Daily Progress</h2>
          <div className="text-sm text-muted-foreground">
            {format(selectedDate, 'MMM d, yyyy')}
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="day-selector flex overflow-x-auto py-2 px-6 scrollbar-hide">
            {dates.map((date, index) => {
              const isToday = isSameDay(new Date(), date);
              const isSelected = isSameDay(selectedDate, date);
              
              return (
                <button
                  key={index}
                  className={`flex-shrink-0 mx-1 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all 
                    ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-xs font-medium">{format(date, 'EEE')}</span>
                  <span className="text-sm font-bold">{format(date, 'd')}</span>
                </button>
              );
            })}
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main habits section */}
        <div className="lg:col-span-2">
          {habits.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-4">Create your first habit to start tracking your progress.</p>
                <Button asChild>
                  <Link href="/dashboard/new-habit">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Habit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  streak={streaks.find(s => s.habit_id === habit.id) || null}
                  logs={logs.filter(l => l.habit_id === habit.id)}
                  onComplete={handleCompleteHabit}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Stats sidebar */}
        <div className="space-y-6">
          {/* Daily progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2 mb-4" />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted rounded-md p-3">
                  <div className="text-2xl font-bold">
                    {habits.filter(habit => 
                      logs.some(log => 
                        log.habit_id === habit.id && 
                        isSameDay(new Date(log.completed_at), selectedDate)
                      )
                    ).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <div className="text-2xl font-bold">
                    {habits.length - habits.filter(habit => 
                      logs.some(log => 
                        log.habit_id === habit.id && 
                        isSameDay(new Date(log.completed_at), selectedDate)
                      )
                    ).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Weekly Activity
              </CardTitle>
              <CardDescription>Your habit completions over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <LineChart 
                  data={weeklyData}
                  xKey="date"
                  yKey="count"
                  height={200}
                  showGrid={false}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-md">
                  <p className="text-muted-foreground text-sm">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Habit Categories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" />
                Habit Categories
              </CardTitle>
              <CardDescription>Distribution of your habits by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <PieChart 
                  data={categoryData}
                  nameKey="name"
                  valueKey="value"
                  height={200}
                  title="Habit Categories"
                  description="Distribution by type"
                  valueLabel="Habits"
                  interactive={true}
                  showLegend={false}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-md">
                  <p className="text-muted-foreground text-sm">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Top Streaks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Top Streaks
              </CardTitle>
              <CardDescription>Your habits with the longest current streaks</CardDescription>
            </CardHeader>
            <CardContent>
              {streakData.length > 0 ? (
                <BarChart 
                  data={streakData}
                  xKey="name"
                  yKey="value"
                  height={200}
                  showGrid={false}
                  name="Days"
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-md">
                  <p className="text-muted-foreground text-sm">No streak data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Top habit */}
          {topHabit && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Habit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: topHabit.color || 'var(--primary)' }}
                  >
                    {topHabit.icon || '✨'}
                  </div>
                  <div>
                    <h3 className="font-medium">{topHabit.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {streaks.find(s => s.habit_id === topHabit.id)?.current_streak || 0} day streak
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Keep up the good work! You're building a great habit.
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/dashboard/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/dashboard/stats">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Statistics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
