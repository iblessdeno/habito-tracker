"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { ReminderForm } from '@/components/reminders/reminder-form'
import { ReminderList } from '@/components/reminders/reminder-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Habit } from '@/types/habit-types'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth-context'

interface RemindersPageProps {
  params: {
    id: string
  }
}

export default function RemindersPage({ params }: RemindersPageProps) {
  const { id } = params
  const habitId = parseInt(id)
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [habit, setHabit] = useState<Habit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      fetchHabit()
    }
  }, [habitId, user, authLoading])

  const fetchHabit = async () => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .single()
      
      if (error) {
        throw error
      }
      
      setHabit(data)
    } catch (error) {
      console.error('Error fetching habit:', error)
      toast({
        title: "Error",
        description: "Failed to load habit details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Habit not found</h2>
          <p className="text-muted-foreground mb-6">
            The habit you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={() => router.push(`/habits/${habitId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Habit
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <Bell className="mr-2 h-6 w-6" />
          Reminders for {habit.title}
        </h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Reminders
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel" : "Add Reminder"}
              </Button>
            </CardTitle>
            <CardDescription>
              Set up reminders to help you stay on track with your habit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="mb-6">
                <ReminderForm 
                  habitId={habitId} 
                  onSuccess={() => {
                    setShowForm(false)
                    toast({
                      title: "Reminder created",
                      description: "Your reminder has been set successfully",
                    })
                  }}
                />
              </div>
            )}
            
            <ReminderList 
              habitId={habitId} 
              onDelete={() => {
                toast({
                  title: "Reminder deleted",
                  description: "Your reminder has been deleted successfully",
                })
              }}
              onUpdate={() => {
                toast({
                  title: "Reminder updated",
                  description: "Your reminder has been updated successfully",
                })
              }}
            />
          </CardContent>
        </Card>
        
        <div className="text-sm text-muted-foreground mt-4">
          <p>
            <strong>Note:</strong> Reminders will only work when you have the app open or have enabled notifications in your browser.
            For the best experience, consider enabling notifications and adding Habito to your home screen.
          </p>
        </div>
      </div>
    </div>
  )
}
