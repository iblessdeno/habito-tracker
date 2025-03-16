'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/basic-calendar'; // Using basic calendar component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isValid } from 'date-fns';
import { ArrowLeft, Check, X } from 'lucide-react';

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
        
        // Use Promise.all to fetch data concurrently for better performance
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const [habitsResponse, logsResponse] = await Promise.all([
          // Fetch habits
          supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          
          // Fetch logs only for the current month to optimize query performance
          supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('completed_at', start.toISOString())
            .lte('completed_at', end.toISOString())
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
  }, [router, date]);

  // Function to check if a habit was completed on a specific date
  const isHabitCompletedOnDate = (habitId: number, date: Date) => {
    // Safety check for invalid date
    if (!date || !isValid(date)) return false;
    
    return logs.some(log => 
      log.habit_id === habitId && 
      isSameDay(new Date(log.completed_at), date)
    );
  };

  // Get completion data for the selected habit - memoized for performance
  const completionData = useMemo(() => {
    if (!selectedHabit) return [];
    
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    return daysInMonth.map(day => ({
      date: day,
      completed: isHabitCompletedOnDate(selectedHabit, day)
    }));
  }, [selectedHabit, logs, date]);
  
  // Calculate completion rate for the selected habit
  const calculateCompletionRate = () => {
    if (!selectedHabit || completionData.length === 0) return 0;
    
    const completedDays = completionData.filter(day => day.completed).length;
    return Math.round((completedDays / completionData.length) * 100);
  };

  // Get color for the selected habit
  const getHabitColor = useMemo(() => {
    if (!selectedHabit) return 'var(--primary)';
    
    const habit = habits.find(h => h.id === selectedHabit);
    return habit?.color || 'var(--primary)';
  }, [selectedHabit, habits]);

  // Effect to add completion indicators after hydration
  useEffect(() => {
    // Only run when we have selected habit and completion data
    if (!selectedHabit || completionData.length === 0) return;
    
    // Need to wait a bit for the calendar to fully render
    const timer = setTimeout(() => {
      // Clear any existing indicators
      document.querySelectorAll(".completion-indicator").forEach(el => el.remove());
      
      // Find all day buttons
      const dayButtons = document.querySelectorAll("[data-day]");
      
      dayButtons.forEach(button => {
        const dateStr = button.getAttribute("data-day");
        if (!dateStr) return;
        
        try {
          const date = new Date(dateStr);
          if (!isValid(date)) return;
          
          // Check if this date has a completion
          const dayData = completionData.find(d => isSameDay(d.date, date));
          if (dayData?.completed) {
            // Add a completion indicator dot below the day
            const indicator = document.createElement("div");
            indicator.className = "completion-indicator absolute bottom-0 left-0 right-0 flex justify-center pb-1";
            
            const dot = document.createElement("div");
            dot.className = "h-1.5 w-1.5 rounded-full bg-primary";
            dot.style.backgroundColor = getHabitColor;
            
            indicator.appendChild(dot);
            button.appendChild(indicator);
          }
        } catch (e) {
          console.error("Error processing date:", e);
        }
      });
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.querySelectorAll(".completion-indicator").forEach(el => el.remove());
    };
  }, [completionData, selectedHabit, getHabitColor]);

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
                    
                    {/* Basic calendar - we'll add indicators via DOM manipulation */}
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      className="rounded-md border"
                    />
                    
                    {/* Add a legend for the indicators */}
                    <div className="mt-2 text-xs text-muted-foreground flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: getHabitColor }}
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
                        {completionData.map((day, index) => (
                          <div 
                            key={index}
                            className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                              day.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                            style={day.completed ? { backgroundColor: getHabitColor } : {}}
                          >
                            {day.date.getDate()}
                          </div>
                        ))}
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
