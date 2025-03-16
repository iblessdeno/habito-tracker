'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, isSameDay } from 'date-fns';
import { ArrowLeft, CheckCircle, Circle, BarChart3, Clock, Calendar as CalendarIcon, Edit, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { HabitCalendar } from '@/components/habit/habit-calendar';
import { HabitHistory } from '@/components/habit/habit-history';
import { formatDate, formatTime, generateHabitColor } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { SignOutButton } from '@/components/auth/sign-out-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function HabitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [habit, setHabit] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completedToday, setCompletedToday] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    async function fetchHabitData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // Fetch habit details
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();
      
      if (habitError || !habitData) {
        console.error('Error fetching habit:', habitError);
        router.push('/dashboard');
        return;
      }
      
      setHabit(habitData);
      
      // Fetch habit logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', params.id)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (!logsError && logsData) {
        setLogs(logsData);
        
        // Check if completed today
        const today = new Date();
        const completedTodayLog = logsData.find((log: any) => 
          isSameDay(new Date(log.completed_at), today)
        );
        setCompletedToday(!!completedTodayLog);
      }
      
      // Fetch streak data
      const { data: streakData, error: streakError } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('habit_id', params.id)
        .eq('user_id', user.id)
        .single();
      
      if (!streakError && streakData) {
        setStreak(streakData);
      }
      
      setLoading(false);
    }
    
    fetchHabitData();
  }, [params.id, router]);

  const toggleHabitCompletion = async (note: string = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      if (completedToday) {
        // Remove today's log
        const today = new Date();
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', params.id)
          .eq('user_id', user.id)
          .gte('completed_at', format(today, 'yyyy-MM-dd'))
          .lt('completed_at', format(subDays(today, -1), 'yyyy-MM-dd'));
        
        if (error) {
          console.error('Error removing log:', error);
          return;
        }
        
        // Update streak if needed
        if (streak) {
          const { error: streakError } = await supabase
            .from('habit_streaks')
            .update({
              current_streak: Math.max(0, streak.current_streak - 1),
              last_tracked_date: format(subDays(today, 1), 'yyyy-MM-dd')
            })
            .eq('id', streak.id);
          
          if (streakError) {
            console.error('Error updating streak:', streakError);
          }
        }
        
        setCompletedToday(false);
        
        // Update logs state
        setLogs(prev => prev.filter(log => !isSameDay(new Date(log.completed_at), today)));
      } else {
        // Add today's log
        const newLog = {
          habit_id: params.id,
          user_id: user.id,
          completed_at: new Date().toISOString(),
          notes: note.trim() || null,
        };
        
        const { data, error } = await supabase
          .from('habit_logs')
          .insert(newLog)
          .select();
        
        if (error) {
          console.error('Error adding log:', error);
          return;
        }
        
        // Update streak
        const today = new Date();
        
        if (streak) {
          const lastDate = new Date(streak.last_tracked_date);
          const isConsecutive = isSameDay(lastDate, subDays(today, 1));
          
          const newCurrentStreak = isConsecutive ? streak.current_streak + 1 : 1;
          const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);
          
          const { error: streakError } = await supabase
            .from('habit_streaks')
            .update({
              current_streak: newCurrentStreak,
              longest_streak: newLongestStreak,
              last_tracked_date: format(today, 'yyyy-MM-dd')
            })
            .eq('id', streak.id);
          
          if (streakError) {
            console.error('Error updating streak:', streakError);
          } else {
            setStreak({
              ...streak,
              current_streak: newCurrentStreak,
              longest_streak: newLongestStreak,
              last_tracked_date: format(today, 'yyyy-MM-dd')
            });
          }
        } else {
          // Create new streak record
          const newStreak = {
            habit_id: params.id,
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_tracked_date: format(today, 'yyyy-MM-dd')
          };
          
          const { data: streakData, error: createStreakError } = await supabase
            .from('habit_streaks')
            .insert(newStreak)
            .select();
          
          if (createStreakError) {
            console.error('Error creating streak:', createStreakError);
          } else if (streakData) {
            setStreak(streakData[0]);
          }
        }
        
        setCompletedToday(true);
        
        // Update logs state
        if (data) {
          setLogs(prev => [data[0], ...prev]);
        }
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
    }
  };

  const handleCompleteClick = () => {
    if (completedToday) {
      // If already completed, just toggle it off
      toggleHabitCompletion();
    } else {
      // If not completed, show dialog to add notes
      setShowCompletionDialog(true);
    }
  };

  const handleCompletionSubmit = () => {
    toggleHabitCompletion(completionNote);
    setCompletionNote('');
    setShowCompletionDialog(false);
  };

  const deleteHabit = async () => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // Delete habit logs
      await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', params.id)
        .eq('user_id', user.id);
      
      // Delete habit streaks
      await supabase
        .from('habit_streaks')
        .delete()
        .eq('habit_id', params.id)
        .eq('user_id', user.id);
      
      // Delete habit
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting habit:', error);
        return;
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  if (loading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const habitColor = habit.color || generateHabitColor(habit.title);

  return (
    <div className="container py-6">
      <div className="mb-8 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <SignOutButton size="sm" showIcon variant="ghost" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{habit.title}</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/habit/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteHabit}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Habit Details */}
        <div className="space-y-6">
          <Card>
            <div 
              className="h-2" 
              style={{ backgroundColor: habitColor }}
            ></div>
            <CardHeader>
              <CardTitle className="text-2xl">{habit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habit.description && (
                  <p className="text-muted-foreground">{habit.description}</p>
                )}
                
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{habit.frequency}</span>
                  {habit.target_count > 1 && (
                    <span className="text-muted-foreground">
                      ({habit.target_count} times)
                    </span>
                  )}
                </div>
                
                {habit.reminder_time && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{habit.reminder_time}</span>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    onClick={handleCompleteClick}
                    className="w-full"
                    variant={completedToday ? "outline" : "default"}
                    style={completedToday ? {} : { backgroundColor: habitColor }}
                  >
                    {completedToday ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Completed Today
                      </>
                    ) : (
                      <>
                        <Circle className="mr-2 h-5 w-5" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-muted-foreground text-sm">Current</p>
                  <p className="text-3xl font-bold">{streak?.current_streak || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Longest</p>
                  <p className="text-3xl font-bold">{streak?.longest_streak || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle Column - Calendar */}
        <div className="space-y-6">
          <HabitCalendar 
            habitId={parseInt(params.id)} 
            habitLogs={logs} 
            color={habitColor}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Completions</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">First Tracked</p>
                  <p className="font-medium">
                    {logs.length > 0 
                      ? formatDate(logs[logs.length - 1].completed_at) 
                      : 'Not tracked yet'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Last Completed</p>
                  <p className="font-medium">
                    {logs.length > 0 
                      ? formatDate(logs[0].completed_at) 
                      : 'Not completed yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Activity Log */}
        <div className="space-y-6">
          <HabitHistory 
            habitLogs={logs}
            color={habitColor}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length > 0 ? (
                  logs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{formatDate(log.completed_at)}</p>
                        <p className="text-sm text-muted-foreground">{formatTime(log.completed_at)}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Habit</DialogTitle>
            <DialogDescription>
              Add optional notes about your completion of "{habit?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="How did it go? (optional)"
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCompletionDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCompletionSubmit}
              style={{ backgroundColor: habitColor }}
            >
              Complete Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
