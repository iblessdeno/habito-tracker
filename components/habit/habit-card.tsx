'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Edit, Trophy } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: {
    id: number;
    title: string;
    description?: string;
    frequency: string;
    target_count: number;
    color?: string;
    icon?: string;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
  } | null;
  logs: Array<{
    id: number;
    habit_id: number;
    completed_at: string;
    notes?: string;
  }>;
  onComplete: (habitId: number) => Promise<void>;
  selectedDate?: Date;
}

export function HabitCard({ habit, streak, logs, onComplete, selectedDate = new Date() }: HabitCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const isCompletedOnSelectedDate = logs?.some(log => 
    isSameDay(new Date(log.completed_at), selectedDate)
  );
  
  const handleToggleCompletion = async () => {
    setIsLoading(true);
    try {
      await onComplete(habit.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Get icon based on habit title
  const getHabitIcon = () => {
    if (habit.icon) return habit.icon;
    
    const title = habit.title.toLowerCase();
    if (title.includes('exercise') || title.includes('workout') || title.includes('gym')) {
      return '🏃';
    } else if (title.includes('read') || title.includes('book')) {
      return '📚';
    } else if (title.includes('study') || title.includes('learn')) {
      return '💡';
    } else if (title.includes('water') || title.includes('drink')) {
      return '💧';
    } else if (title.includes('walk') || title.includes('hike')) {
      return '🌲';
    } else if (title.includes('meditate') || title.includes('mindfulness')) {
      return '🧘';
    } else if (title.includes('cook') || title.includes('meal')) {
      return '🍳';
    } else if (title.includes('journal') || title.includes('write')) {
      return '📝';
    } else {
      return '✨';
    }
  };

  // Get color class based on habit title or color
  const getHabitColorClass = () => {
    const title = habit.title.toLowerCase();
    if (habit.color) {
      return habit.color;
    } else if (title.includes('exercise') || title.includes('workout') || title.includes('gym')) {
      return 'var(--exercise)';
    } else if (title.includes('read') || title.includes('book')) {
      return 'var(--read)';
    } else if (title.includes('study') || title.includes('learn')) {
      return 'var(--study)';
    } else if (title.includes('water') || title.includes('drink')) {
      return 'var(--water)';
    } else if (title.includes('walk') || title.includes('hike')) {
      return 'var(--walk)';
    } else if (title.includes('meditate') || title.includes('mindfulness')) {
      return 'var(--meditate)';
    } else if (title.includes('cook') || title.includes('meal')) {
      return 'var(--cook)';
    } else if (title.includes('journal') || title.includes('write')) {
      return 'var(--journal)';
    } else {
      return 'var(--exercise)';
    }
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <Card className="habit-card overflow-hidden">
      <div className="flex items-center p-4">
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: getHabitColorClass() }}
        >
          {getHabitIcon()}
        </div>
        <div className="flex-1 ml-4">
          <div className="flex justify-between items-center mb-1">
            <Link href={`/dashboard/habit/${habit.id}`} className="text-lg font-bold hover:underline">
              {habit.title}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 -mr-2"
            >
              <Link href={`/dashboard/habit/${habit.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </div>
          
          {habit.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{habit.description}</p>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">
                {streak?.current_streak || 0} day{(streak?.current_streak || 0) !== 1 ? 's' : ''} streak
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {habit.frequency} • {habit.target_count} {habit.target_count === 1 ? 'time' : 'times'}
            </span>
          </div>
          
          <Button
            variant={isCompletedOnSelectedDate ? "outline" : "default"}
            className={cn(
              "w-full",
              isCompletedOnSelectedDate && "border-green-500 text-green-500 hover:bg-green-50"
            )}
            onClick={handleToggleCompletion}
            disabled={isLoading || !isToday}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                Loading...
              </span>
            ) : isCompletedOnSelectedDate ? (
              <span className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                {isToday ? 'Completed' : 'Completed on this day'}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Circle className="mr-2 h-4 w-4" />
                {isToday ? 'Mark as Complete' : 'Not completed'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
