'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define the form schema
const habitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.coerce.number().int().min(1, 'Target count must be at least 1'),
  reminder_time: z.string().optional(),
  color: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

export default function EditHabitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      description: '',
      frequency: 'daily',
      target_count: 1,
      reminder_time: '',
      color: '#4f46e5',
    },
  });

  // Fetch habit data on component mount
  useEffect(() => {
    async function fetchHabit() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        const { data: habit, error } = await supabase
          .from('habits')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching habit:', error);
          setError('Habit not found or you do not have permission to edit it.');
          setLoading(false);
          return;
        }
        
        if (habit) {
          // Reset form with habit data
          form.reset({
            title: habit.title || '',
            description: habit.description || '',
            frequency: habit.frequency || 'daily',
            target_count: habit.target_count || 1,
            reminder_time: habit.reminder_time || '',
            color: habit.color || '#4f46e5',
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred.');
        setLoading(false);
      }
    }
    
    fetchHabit();
  }, [params.id, router, form]);

  // Handle form submission
  const onSubmit = async (values: HabitFormValues) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // Update the habit
      const { error } = await supabase
        .from('habits')
        .update({
          title: values.title,
          description: values.description,
          frequency: values.frequency,
          target_count: values.target_count,
          reminder_time: values.reminder_time,
          color: values.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating habit:', error);
        setError('Failed to update habit. Please try again.');
        setSubmitting(false);
        return;
      }
      
      // Navigate back to habit detail page
      router.push(`/dashboard/habit/${params.id}`);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <Link href={`/dashboard/habit/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Habit
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Habit</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning Run" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Run for 30 minutes in the morning" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="target_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reminder_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Time (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-12 h-10 p-1"
                          />
                          <Input 
                            type="text" 
                            {...field} 
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/habit/${params.id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
