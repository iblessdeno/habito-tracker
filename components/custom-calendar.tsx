"use client";

import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates?: Date[];
  completionColor?: string;
  streaks?: { date: Date; count: any }[];
  missedDates?: Date[];
}

export function CustomCalendar({ 
  selectedDate, 
  onSelectDate, 
  completedDates = [], 
  completionColor = '#0ea5e9',
  streaks = [],
  missedDates = []
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  
  // Get days for the current month view (including days from prev/next month to fill weeks)
  const getDaysForCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = getDaysForCalendar();
  
  // Check if a date is completed
  const isDateCompleted = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };
  
  // Check if a date has a streak
  const getDateStreak = (date: Date) => {
    const streak = streaks.find(s => isSameDay(s.date, date));
    return streak ? streak.count : 0;
  };
  
  // Check if a date is missed
  const isDateMissed = (date: Date) => {
    return missedDates.some(missedDate => isSameDay(missedDate, date));
  };
  
  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Update currentMonth when selectedDate changes
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate]);
  
  // Group days into weeks
  const weeks: Date[][] = [];
  let week: Date[] = [];
  
  calendarDays.forEach((day, i) => {
    if (i % 7 === 0 && week.length) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
    
    if (i === calendarDays.length - 1) {
      weeks.push(week);
    }
  });
  
  return (
    <div className="calendar border rounded-md p-4 w-full">
      {/* Calendar header with month and navigation */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Calendar grid */}
      <div className="overflow-hidden rounded-md border">
        {/* Day names header */}
        <div className="grid grid-cols-7 bg-muted">
          {daysOfWeek.map(day => (
            <div 
              key={day} 
              className="text-center py-2 text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="bg-background">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const completed = isDateCompleted(day);
                const missed = isDateMissed(day);
                const streak = getDateStreak(day);
                
                return (
                  <div 
                    key={dayIndex}
                    className={`
                      relative min-h-[40px] p-1 
                      ${isCurrentMonth ? 'bg-background' : 'bg-muted/50 text-muted-foreground'}
                      ${isSelected ? 'bg-primary/10' : ''}
                      ${missed && isCurrentMonth ? 'bg-red-50' : ''}
                      ${dayIndex === 0 ? '' : 'border-l'}
                    `}
                  >
                    <button
                      onClick={() => onSelectDate(day)}
                      className={`
                        w-full h-full flex flex-col items-center justify-center
                        rounded-full text-sm
                        ${isSelected ? 'font-bold' : ''}
                        ${isTodayDate ? 'border border-primary' : ''}
                        ${!isCurrentMonth ? 'opacity-50' : ''}
                        hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary
                      `}
                      disabled={!isCurrentMonth}
                    >
                      <span>{format(day, 'd')}</span>
                      
                      {/* Indicators container */}
                      <div className="flex items-center gap-1 mt-1">
                        {/* Completion indicator */}
                        {completed && (
                          <div 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: completionColor }}
                          />
                        )}
                        
                        {/* Streak indicator */}
                        {streak > 0 && (
                          <div className="text-xs font-medium text-green-600">
                            {streak}
                          </div>
                        )}
                        
                        {/* Missed indicator */}
                        {missed && (
                          <div 
                            className="w-1.5 h-1.5 rounded-full bg-red-500"
                          />
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
