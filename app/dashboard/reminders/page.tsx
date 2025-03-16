"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Habit, Reminder } from '@/types/habit-types'
import { Spinner } from '@/components/ui/spinner'
import { format } from 'date-fns'
import Link from 'next/link'

interface HabitWithReminders extends Habit {
  reminders: Reminder[]
}

export default function RemindersPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [habitsWithReminders, setHabitsWithReminders] = useState<HabitWithReminders[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHabitsWithReminders()
    
    // Subscribe to changes in the reminders table
    const remindersSubscription = supabase
      .channel('reminders-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reminders' 
      }, () => {
        fetchHabitsWithReminders()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(remindersSubscription)
    }
  }, [])

  const fetchHabitsWithReminders = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // First, check if the required tables exist
      try {
        // Check if the habits table exists
        const { error: habitsTableError } = await supabase
          .from('habits')
          .select('count(*)', { count: 'exact', head: true })
        
        if (habitsTableError) {
          console.log('Habits table might not exist yet:', habitsTableError.message)
          setHabitsWithReminders([])
          setIsLoading(false)
          return
        }
        
        // Check if the reminders table exists
        const { error: remindersTableError } = await supabase
          .from('reminders')
          .select('count(*)', { count: 'exact', head: true })
        
        if (remindersTableError) {
          console.log('Reminders table might not exist yet:', remindersTableError.message)
          // We can still show habits without reminders
        }
      } catch (tableError) {
        console.log('Error checking table existence:', tableError)
        setHabitsWithReminders([])
        setIsLoading(false)
        return
      }
      
      // Get all habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false })
      
      if (habitsError) {
        console.error('Error fetching habits:', habitsError)
        setHabitsWithReminders([])
        setIsLoading(false)
        return
      }
      
      if (!habits || habits.length === 0) {
        setHabitsWithReminders([])
        setIsLoading(false)
        return
      }
      
      // Then get all reminders
      let reminders = []
      try {
        const { data: remindersData, error: remindersError } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (remindersError) {
          if (remindersError.message.includes('does not exist')) {
            console.log('Reminders table does not exist yet')
          } else {
            console.error('Error fetching reminders:', remindersError)
          }
          // Continue with empty reminders
        } else {
          reminders = remindersData || []
        }
      } catch (reminderError) {
        console.log('Error in reminders query:', reminderError)
        // Continue with empty reminders
      }
      
      // Group reminders by habit
      const habitsWithRemindersData = habits.map(habit => {
        const habitReminders = reminders.filter(r => r.habit_id === habit.id) || []
        return {
          ...habit,
          reminders: habitReminders
        }
      })
      
      // Sort habits with reminders first
      habitsWithRemindersData.sort((a, b) => {
        if (a.reminders.length > 0 && b.reminders.length === 0) return -1
        if (a.reminders.length === 0 && b.reminders.length > 0) return 1
        return 0
      })
      
      setHabitsWithReminders(habitsWithRemindersData)
    } catch (error) {
      console.error('Error fetching habits with reminders:', error)
      
      // Set empty array to avoid UI issues
      setHabitsWithReminders([])
      
      // Only show toast for non-table-existence errors
      if (!(error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation') || 
           error.message.includes('undefined')))) {
        toast({
          title: "Error",
          description: "Failed to load reminders. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDaysOfWeek = (daysArray: string[]) => {
    if (daysArray.length === 7) return 'Every day'
    
    const shortDays = daysArray.map(day => day.substring(0, 3))
    return shortDays.join(', ')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Bell className="mr-3 h-8 w-8" />
        Reminders
      </h1>
      <p className="text-muted-foreground mb-8">
        Manage reminders for all your habits
      </p>
      
      <div className="grid gap-6">
        {habitsWithReminders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="py-12">
                <Bell className="mx-auto h-12 w-12 opacity-30 mb-3" />
                <h3 className="text-lg font-medium mb-1">No habits available for reminders</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {isLoading ? 
                    "Loading your habits..." : 
                    "You can set up reminders for your habits to stay on track"}
                </p>
                <Button onClick={() => router.push('/habits')}>
                  <ChevronRight className="mr-2 h-4 w-4" />
                  View Your Habits
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          habitsWithReminders.map(habit => (
            <Card key={habit.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <span className="mr-2">{habit.icon}</span>
                  {habit.title}
                </CardTitle>
                <CardDescription>
                  {habit.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {habit.reminders.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      No reminders set for this habit
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/habits/${habit.id}/reminders`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Reminder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habit.reminders.map(reminder => (
                      <div 
                        key={reminder.id} 
                        className="flex items-center justify-between p-3 rounded-md border"
                      >
                        <div>
                          <div className="font-medium flex items-center">
                            <Bell className="h-4 w-4 mr-2" />
                            {reminder.reminder_time}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDaysOfWeek(reminder.days_of_week)}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/habits/${habit.id}/reminders`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="pt-2">
                      <Link href={`/habits/${habit.id}/reminders`}>
                        <Button variant="link" size="sm" className="px-0">
                          Manage reminders
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
