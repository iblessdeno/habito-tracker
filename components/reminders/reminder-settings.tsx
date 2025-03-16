"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BellRing, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface ReminderSettingsProps {
  habitId: number;
  userId: string;
  initialReminders?: any[];
}

export function ReminderSettings({ habitId, userId, initialReminders = [] }: ReminderSettingsProps) {
  const [reminders, setReminders] = useState<any[]>(initialReminders);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Add a new reminder
  const addReminder = () => {
    const newReminder = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      habit_id: habitId,
      user_id: userId,
      time: '09:00',
      days: [1, 2, 3, 4, 5], // Monday to Friday by default
      enabled: true,
      created_at: new Date().toISOString()
    };
    
    setReminders([...reminders, newReminder]);
  };
  
  // Remove a reminder
  const removeReminder = async (reminderId: string | number) => {
    setIsLoading(true);
    
    // Check if it's a temporary ID
    if (typeof reminderId === 'string' && reminderId.startsWith('temp-')) {
      setReminders(reminders.filter(r => r.id !== reminderId));
      setIsLoading(false);
      return;
    }
    
    // Delete from database
    try {
      const { error } = await supabase
        .from('habit_reminders')
        .delete()
        .eq('id', reminderId);
      
      if (error) throw error;
      
      setReminders(reminders.filter(r => r.id !== reminderId));
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been removed"
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update reminder field
  const updateReminderField = (reminderId: string | number, field: string, value: any) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, [field]: value } : reminder
    ));
  };
  
  // Toggle day selection
  const toggleDay = (reminderId: string | number, day: number) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    
    const days = [...reminder.days];
    const index = days.indexOf(day);
    
    if (index === -1) {
      days.push(day);
    } else {
      days.splice(index, 1);
    }
    
    updateReminderField(reminderId, 'days', days);
  };
  
  // Save all reminders
  const saveReminders = async () => {
    setIsLoading(true);
    
    try {
      // Process each reminder
      for (const reminder of reminders) {
        // For new reminders (with temporary IDs)
        if (typeof reminder.id === 'string' && reminder.id.startsWith('temp-')) {
          const { id, ...reminderData } = reminder;
          
          // Insert new reminder
          const { data, error } = await supabase
            .from('habit_reminders')
            .insert(reminderData)
            .select();
          
          if (error) throw error;
          
          // Update the reminder with the real ID
          if (data && data.length > 0) {
            updateReminderField(id, 'id', data[0].id);
          }
        } else {
          // Update existing reminder
          const { error } = await supabase
            .from('habit_reminders')
            .update({
              time: reminder.time,
              days: reminder.days,
              enabled: reminder.enabled
            })
            .eq('id', reminder.id);
          
          if (error) throw error;
        }
      }
      
      toast({
        title: "Reminders saved",
        description: "Your reminder settings have been updated"
      });
    } catch (error) {
      console.error('Error saving reminders:', error);
      toast({
        title: "Error",
        description: "Failed to save reminder settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Day names for display
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellRing className="mr-2 h-5 w-5" />
          Reminder Settings
        </CardTitle>
        <CardDescription>
          Set up reminders to help you stay on track with your habit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No reminders set</p>
              <Button onClick={addReminder}>Add your first reminder</Button>
            </div>
          ) : (
            <>
              {reminders.map((reminder, index) => (
                <div key={reminder.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="font-medium">Reminder {index + 1}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeReminder(reminder.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`time-${reminder.id}`}>Time</Label>
                      <Input
                        id={`time-${reminder.id}`}
                        type="time"
                        value={reminder.time}
                        onChange={(e) => updateReminderField(reminder.id, 'time', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`enabled-${reminder.id}`}
                        checked={reminder.enabled}
                        onCheckedChange={(checked: boolean) => updateReminderField(reminder.id, 'enabled', checked)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={`enabled-${reminder.id}`}>Enabled</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {dayNames.map((name, day) => (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={reminder.days.includes(day) ? "default" : "outline"}
                          onClick={() => toggleDay(reminder.id, day)}
                          disabled={isLoading}
                          className="w-10 h-10 p-0"
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={addReminder}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
                
                <Button 
                  onClick={saveReminders}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Reminders'}
                </Button>
              </div>
            </>
          )}
          
          <div className="text-xs text-muted-foreground mt-4">
            <p>Note: Reminders will be sent as push notifications if you've allowed notifications in your browser.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
