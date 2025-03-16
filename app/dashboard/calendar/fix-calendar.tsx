'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isValid } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import styles from './calendar.module.css';

// Import the original DayPicker directly
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const isHabitCompletedOnDate = (habitId: number, checkDate: Date) => {
    if (!checkDate || !isValid(checkDate)) return false;
    
    return logs.some(log => 
      log.habit_id === habitId && 
      isSameDay(new Date(log.completed_at), checkDate)
    );
  };

  // Get color for the selected habit
  const getHabitColor = () => {
    if (!selectedHabit) return 'var(--primary)';
    
    const habit = habits.find(h => h.id === selectedHabit);
    return habit?.color || 'var(--primary)';
  };

  // Calculate completion rate
  const calculateCompletionRate = () => {
    if (!selectedHabit) return 0;
    
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    let completedDays = 0;
    daysInMonth.forEach(day => {
      if (isHabitCompletedOnDate(selectedHabit, day)) {
        completedDays++;
      }
    });
    
    return Math.round((completedDays / daysInMonth.length) * 100);
  };

  // Force calendar text to be visible via direct DOM manipulation
  useEffect(() => {
    if (!mounted) return;
    
    // Give time for the calendar to fully render
    const timer = setTimeout(() => {
      // Force day cells to have visible text
      const dayButtons = document.querySelectorAll('.rdp-button');
      dayButtons.forEach(button => {
        (button as HTMLElement).style.color = 'var(--foreground)';
      });
      
      // Add indicators for completed days
      if (selectedHabit) {
        document.querySelectorAll('.habit-indicator').forEach(el => el.remove());
        
        const dayButtons = document.querySelectorAll('.rdp-day');
        dayButtons.forEach(button => {
          try {
            const dateAttr = button.getAttribute('aria-label');
            if (!dateAttr) return;
            
            const day = new Date(dateAttr);
            if (!isValid(day)) return;
            
            if (isHabitCompletedOnDate(selectedHabit, day)) {
              const indicator = document.createElement('div');
              indicator.className = 'habit-indicator';
              indicator.style.position = 'absolute';
              indicator.style.bottom = '2px';
              indicator.style.left = '50%';
              indicator.style.transform = 'translateX(-50%)';
              indicator.style.width = '6px';
              indicator.style.height = '6px';
              indicator.style.borderRadius = '50%';
              indicator.style.backgroundColor = getHabitColor();
              
              button.appendChild(indicator);
            }
          } catch (error) {
            console.error('Error adding indicators:', error);
          }
        });
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.querySelectorAll('.habit-indicator').forEach(el => el.remove());
    };
  }, [mounted, selectedHabit, logs]);

  // The actual calendar component
  const CalendarComponent = () => {
    if (!mounted) return <div className="h-[300px] bg-muted animate-pulse rounded-md"></div>;

    return (
      <div className="calendar-wrapper" style={{ '--rdp-cell-size': '40px' } as React.CSSProperties}>
        <style jsx global>{`
          /* Force calendar styles */
          .rdp-button { 
            color: var(--foreground) !important;
            font-size: 14px !important; 
          }
          .rdp-day_selected { 
            background-color: var(--primary) !important;
            color: var(--primary-foreground) !important;
          }
          .rdp-day_today { 
            font-weight: bold !important;
            border: 1px solid var(--accent) !important;
          }
          .rdp {
            margin: 0 !important;
          }
          /* Force table display */
          table.rdp-table {
            display: table !important;
            width: 100% !important;
          }
          .rdp-head_row, .rdp-row {
            display: table-row !important;
          }
          .rdp-head_cell, .rdp-cell {
            display: table-cell !important;
            height: 40px !important;
            text-align: center !important;
          }
        `}</style>
        <DayPicker
          mode="single"
          selected={date}
          onSelect={(day) => day && setDate(day)}
          modifiers={{ 
            completed: (day) => selectedHabit ? isHabitCompletedOnDate(selectedHabit, day) : false 
          }}
          modifiersStyles={{
            completed: { 
              fontWeight: 'bold'
            }
          }}
        />
      </div>
    );
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
                    
                    <CalendarComponent />
                    
                    <div className="mt-4 text-sm text-muted-foreground flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getHabitColor() }}
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
                        {eachDayOfInterval({
                          start: startOfMonth(date),
                          end: endOfMonth(date)
                        }).map((day, index) => {
                          const isCompleted = isHabitCompletedOnDate(selectedHabit, day);
                          return (
                            <div 
                              key={index}
                              className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                                isCompleted ? 'text-white' : 'bg-muted'
                              }`}
                              style={isCompleted ? { backgroundColor: getHabitColor() } : {}}
                            >
                              {day.getDate()}
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
