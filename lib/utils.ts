import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isSameDay, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to display in a human-readable format
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy')
}

// Format time to display in a human-readable format
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'h:mm a')
}

// Check if a habit was completed today
export function isHabitCompletedToday(logs: any[]): boolean {
  if (!logs || logs.length === 0) return false
  
  return logs.some(log => isToday(new Date(log.completed_at)))
}

// Calculate streak for a habit based on logs
export function calculateStreak(logs: any[]): { current: number, longest: number } {
  if (!logs || logs.length === 0) {
    return { current: 0, longest: 0 }
  }
  
  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )
  
  let currentStreak = 0
  let longestStreak = 0
  let lastDate = new Date()
  
  // Calculate current streak
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].completed_at)
    
    if (i === 0) {
      // First log
      if (isToday(logDate) || differenceInDays(new Date(), logDate) === 1) {
        currentStreak = 1
      } else {
        break // Streak is broken
      }
    } else {
      const prevDate = new Date(sortedLogs[i-1].completed_at)
      
      if (differenceInDays(prevDate, logDate) === 1) {
        currentStreak++
      } else if (!isSameDay(prevDate, logDate)) {
        break // Streak is broken
      }
    }
    
    lastDate = logDate
  }
  
  // Calculate longest streak
  let tempStreak = 1
  for (let i = 1; i < sortedLogs.length; i++) {
    const currentDate = new Date(sortedLogs[i].completed_at)
    const prevDate = new Date(sortedLogs[i-1].completed_at)
    
    if (differenceInDays(prevDate, currentDate) === 1 || isSameDay(prevDate, currentDate)) {
      if (!isSameDay(prevDate, currentDate)) {
        tempStreak++
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)
  
  return { current: currentStreak, longest: longestStreak }
}

// Generate a color based on habit name (for habits without a specified color)
export function generateHabitColor(habitName: string): string {
  const colors = [
    '#4f46e5', // indigo
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ]
  
  // Simple hash function to get a consistent color for the same habit name
  let hash = 0
  for (let i = 0; i < habitName.length; i++) {
    hash = habitName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
