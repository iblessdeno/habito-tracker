'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, isValid } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { CustomCalendar } from '@/components/custom-calendar';

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        // Fetch habits and logs for the current month
        const [habitsResponse, logsResponse] = await Promise.all([
          supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          
          supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
        ]);
        
        if (habitsResponse.error) throw habitsResponse.error;
        if (logsResponse.error) throw logsResponse.error;
        
        const habitsData = habitsResponse.data || [];
        setHabits(habitsData);
        
        if (habitsData.length > 0 && !selectedHabit) {
          setSelectedHabit(habitsData[0].id);
        }
        
        setLogs(logsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  // Get completed dates for the selected habit
  const completedDates = useMemo(() => {
    if (!selectedHabit) return [];
    
    return logs
      .filter(log => log.habit_id === selectedHabit)
      .map(log => {
        const date = new Date(log.completed_at);
        return isValid(date) ? date : null;
      })
      .filter(Boolean) as Date[];
  }, [selectedHabit, logs]);
  
  // Get color for the selected habit
  const habitColor = useMemo(() => {
    if (!selectedHabit) return 'var(--primary)';
    
    const habit = habits.find(h => h.id === selectedHabit);
    return habit?.color || 'var(--primary)';
  }, [selectedHabit, habits]);

  // Calculate completion rate for the selected habit
  const calculateCompletionRate = () => {
    if (!selectedHabit || !completedDates.length) return 0;
    
    // For a simple calculation, we'll use the number of completed dates in the current month
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    const completionsThisMonth = completedDates.filter(date => 
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    ).length;
    
    // Calculate days in month (approximation)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    return Math.round((completionsThisMonth / daysInMonth) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Habit Calendar</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                {habits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No habits created yet</p>
                    <Link href="/dashboard/new-habit">
                      <Button>Create your first habit</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {habits.map(habit => (
                        <Button
                          key={habit.id}
                          variant={selectedHabit === habit.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedHabit(habit.id)}
                          className="flex items-center gap-1"
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: habit.color || 'var(--primary)' }}
                          />
                          {habit.title}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Our custom calendar component */}
                    <CustomCalendar
                      selectedDate={date}
                      onSelectDate={setDate}
                      completedDates={completedDates}
                      completionColor={habitColor}
                    />
                    
                    <div className="mt-4 text-sm text-muted-foreground flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: habitColor }}
                      />
                      <span>Completed days</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Stats for {selectedHabit ? habits.find(h => h.id === selectedHabit)?.title : 'Selected Habit'}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedHabit ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
                      <div className="text-3xl font-bold">{calculateCompletionRate()}%</div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">This Month</h3>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }).map((_, index) => {
                          const currentDate = new Date(date.getFullYear(), date.getMonth(), index + 1);
                          const isCompleted = completedDates.some(completedDate => 
                            isSameDay(completedDate, currentDate)
                          );
                          
                          return (
                            <div 
                              key={index}
                              className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                                isCompleted ? 'text-white' : 'bg-muted'
                              }`}
                              style={isCompleted ? { backgroundColor: habitColor } : {}}
                            >
                              {index + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a habit to view stats
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
