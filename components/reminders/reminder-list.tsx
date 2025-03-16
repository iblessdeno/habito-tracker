"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Reminder } from '@/types/habit-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Clock, Edit, Trash2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ReminderForm } from './reminder-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ReminderListProps {
  habitId: number
  habitTitle?: string
  onDelete?: () => void
  onUpdate?: () => void
}

// Extended Reminder type to handle both string and array formats for days_of_week
interface ExtendedReminder extends Omit<Reminder, 'days_of_week'> {
  days_of_week: string[] | string;
}

export function ReminderList({ habitId, habitTitle, onDelete, onUpdate }: ReminderListProps) {
  const { toast } = useToast()
  const [reminders, setReminders] = useState<ExtendedReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null)

  const fetchReminders = async () => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('habit_id', habitId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast({
        title: "Error",
        description: "Failed to load reminders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [habitId])

  const handleToggleReminder = async (reminder: ExtendedReminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          enabled: !reminder.enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setReminders(reminders.map(r => 
        r.id === reminder.id ? { ...r, enabled: !r.enabled } : r
      ))
      
      toast({
        title: reminder.enabled ? "Reminder disabled" : "Reminder enabled",
        description: `Reminder for "${habitTitle}" has been ${reminder.enabled ? 'disabled' : 'enabled'}`,
      })
    } catch (error) {
      console.error('Error toggling reminder:', error)
      toast({
        title: "Error",
        description: "Failed to update reminder. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderToDelete)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setReminders(reminders.filter(r => r.id !== reminderToDelete))
      
      toast({
        title: "Reminder deleted",
        description: "The reminder has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast({
        title: "Error",
        description: "Failed to delete reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setReminderToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const formatDaysOfWeek = (daysArray: string[] | string) => {
    // Convert string to array if needed
    const days = typeof daysArray === 'string' ? daysArray.split(',') : daysArray
    
    if (days.length === 7) return 'Every day'
    
    const dayMap: Record<string, string> = {
      'monday': 'Mon',
      'tuesday': 'Tue',
      'wednesday': 'Wed',
      'thursday': 'Thu',
      'friday': 'Fri',
      'saturday': 'Sat',
      'sunday': 'Sun'
    }
    
    return days.map(day => dayMap[day.toLowerCase()] || day).join(', ')
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Reminders</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <ReminderForm 
              habitId={habitId} 
              habitTitle={habitTitle} 
              onSuccess={fetchReminders}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : reminders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>No reminders set for this habit</p>
            <p className="text-sm mt-1">
              Add a reminder to help you stay on track
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={!reminder.enabled ? "opacity-70" : undefined}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      {formatTime(reminder.reminder_time)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDaysOfWeek(reminder.days_of_week)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={reminder.enabled} 
                      onCheckedChange={() => handleToggleReminder(reminder)}
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <ReminderForm 
                          habitId={habitId} 
                          habitTitle={habitTitle} 
                          onSuccess={fetchReminders}
                          existingReminder={{
                            habit_id: reminder.habit_id,
                            reminder_time: reminder.reminder_time,
                            days_of_week: typeof reminder.days_of_week === 'string' 
                              ? reminder.days_of_week.split(',') 
                              : reminder.days_of_week,
                            enabled: reminder.enabled
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setReminderToDelete(reminder.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReminder} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
