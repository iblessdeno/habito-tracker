'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { HabitTemplates } from '@/components/habit-templates';
import { HabitTemplate } from '@/types/habit-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const habitFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }).max(50, {
    message: 'Title must not be longer than 50 characters.',
  }),
  description: z.string().max(200, {
    message: 'Description must not be longer than 200 characters.',
  }).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    required_error: 'Please select a frequency.',
  }),
  target_count: z.coerce.number().min(1, {
    message: 'Target count must be at least 1.',
  }).max(100, {
    message: 'Target count must not be greater than 100.',
  }),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

export default function NewHabitPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("manual");
  
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: '',
      description: '',
      frequency: 'daily',
      target_count: 1,
      color: '',
      icon: '',
    },
  });

  const onSubmit = async (data: HabitFormValues) => {
    setIsLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create new habit
      const { data: habit, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          frequency: data.frequency,
          target_count: data.target_count,
          color: data.color || null,
          icon: data.icon || null,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error creating habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a template
  const handleSelectTemplate = (template: HabitTemplate) => {
    form.setValue('title', template.title);
    form.setValue('description', template.description);
    form.setValue('frequency', template.frequency);
    form.setValue('target_count', template.target_count);
    form.setValue('color', template.color);
    form.setValue('icon', template.icon);
    
    // Switch to manual tab to review and submit
    setActiveTab("manual");
  };

  // Color options for habits
  const colorOptions = [
    { name: 'Exercise', value: 'var(--exercise)' },
    { name: 'Read', value: 'var(--read)' },
    { name: 'Study', value: 'var(--study)' },
    { name: 'Water', value: 'var(--water)' },
    { name: 'Walk', value: 'var(--walk)' },
    { name: 'Meditate', value: 'var(--meditate)' },
    { name: 'Cook', value: 'var(--cook)' },
    { name: 'Journal', value: 'var(--journal)' },
  ];

  // Icon options for habits
  const iconOptions = [
    { name: 'Exercise', value: '🏃' },
    { name: 'Read', value: '📚' },
    { name: 'Study', value: '💡' },
    { name: 'Water', value: '💧' },
    { name: 'Walk', value: '🌲' },
    { name: 'Meditate', value: '🧘' },
    { name: 'Cook', value: '🍳' },
    { name: 'Journal', value: '📝' },
    { name: 'Other', value: '✨' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Habit</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Habit</CardTitle>
          <CardDescription>
            Create a new habit to track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter habit title" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your habit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter habit description (optional)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of your habit
                        </FormDescription>
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
                          <FormDescription>
                            How often you want to track this habit
                          </FormDescription>
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
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            How many times to complete per frequency period
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 rounded-full mr-2" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a color for your habit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {iconOptions.map((icon) => (
                                <SelectItem key={icon.value} value={icon.value}>
                                  <div className="flex items-center">
                                    <span className="mr-2">{icon.value}</span>
                                    {icon.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose an icon for your habit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>Creating...</span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Create Habit
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="templates">
              <HabitTemplates onSelectTemplate={handleSelectTemplate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
