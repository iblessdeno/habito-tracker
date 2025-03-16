"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReminderFormValues } from '@/types/habit-types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

const reminderFormSchema = z.object({
  habit_id: z.number(),
  reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in the format HH:MM",
  }),
  days_of_week: z.array(z.string()).min(1, {
    message: "Select at least one day of the week",
  }),
  enabled: z.boolean().default(true),
})

interface ReminderFormProps {
  habitId: number
  habitTitle?: string
  onSuccess?: () => void
  existingReminder?: ReminderFormValues
}

export function ReminderForm({ habitId, habitTitle, onSuccess, existingReminder }: ReminderFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: existingReminder || {
      habit_id: habitId,
      reminder_time: "09:00",
      days_of_week: ["1", "2", "3", "4", "5"],
      enabled: true,
    },
  })

  const onSubmit = async (data: ReminderFormValues) => {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Convert days_of_week array to string
      const daysOfWeekString = data.days_of_week.join(',')
      
      // Create or update reminder
      const { error } = await supabase
        .from('reminders')
        .upsert({
          user_id: user.id,
          habit_id: data.habit_id,
          reminder_time: data.reminder_time,
          days_of_week: daysOfWeekString,
          enabled: data.enabled,
          updated_at: new Date().toISOString(),
        })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Reminder saved",
        description: `You'll be reminded to ${habitTitle} at ${data.reminder_time}`,
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving reminder:', error)
      toast({
        title: "Error",
        description: "Failed to save reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const daysOfWeek = [
    { label: "Monday", value: "1" },
    { label: "Tuesday", value: "2" },
    { label: "Wednesday", value: "3" },
    { label: "Thursday", value: "4" },
    { label: "Friday", value: "5" },
    { label: "Saturday", value: "6" },
    { label: "Sunday", value: "0" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Set Reminder
        </CardTitle>
        <CardDescription>
          Create a reminder for your "{habitTitle}" habit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reminder_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set the time when you want to be reminded
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="days_of_week"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Days of Week</FormLabel>
                    <FormDescription>
                      Select the days when you want to receive reminders
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="days_of_week"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.value}
                              className="flex flex-col items-center space-y-2"
                            >
                              <FormLabel className="text-xs text-center">
                                {day.label.substring(0, 1)}
                              </FormLabel>
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked: boolean) => {
                                    return checked
                                      ? field.onChange([...field.value, day.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable Reminder
                    </FormLabel>
                    <FormDescription>
                      Turn reminders on or off
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Reminder"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
