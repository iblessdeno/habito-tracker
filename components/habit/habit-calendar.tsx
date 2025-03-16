'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, format } from 'date-fns';

interface HabitCalendarProps {
  habitId: number;
  habitLogs: any[];
  color?: string;
}

export function HabitCalendar({ habitId, habitLogs, color = '#4f46e5' }: HabitCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());
  
  // Create a set of dates when the habit was completed
  const completedDates = new Set(
    habitLogs.map(log => {
      const date = new Date(log.completed_at);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  
  // Function to check if a date is a completed date
  const isCompletedDate = (date: Date): boolean => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return completedDates.has(dateKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Completion Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          className="rounded-md border"
          modifiers={{
            completed: (date) => isCompletedDate(date)
          }}
          modifiersStyles={{
            completed: {
              backgroundColor: color,
              color: 'white',
              fontWeight: 'bold'
            }
          }}
        />
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: color }}
            ></div>
            <span>Completed</span>
          </div>
          <div className="text-muted-foreground">
            {habitLogs.length} total completions
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
