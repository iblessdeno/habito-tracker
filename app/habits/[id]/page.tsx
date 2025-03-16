"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Edit, 
  BarChart2, 
  ArrowLeft,
  Share2,
  Trophy
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Habit, HabitLog } from '@/types/habit-types'
import { Spinner } from '@/components/ui/spinner'
import { format, isToday, isYesterday, subDays } from 'date-fns'
import { SocialIntegration } from '@/components/social/social-integration'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HabitDetailsPageProps {
  params: {
    id: string
  }
}

export default function HabitDetailsPage({ params }: HabitDetailsPageProps) {
  const { id } = params
  const habitId = parseInt(id)
  const { toast } = useToast()
  const router = useRouter()
  
  const [habit, setHabit] = useState<Habit | null>(null)
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [todayProgress, setTodayProgress] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>("overview")

  useEffect(() => {
    fetchHabitDetails()
    
    // Subscribe to changes in the habits and habit_logs tables
    const habitsSubscription = supabase
      .channel('habits-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'habits',
        filter: `id=eq.${habitId}`
      }, () => {
        fetchHabitDetails()
      })
      .subscribe()
    
    const logsSubscription = supabase
      .channel('logs-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'habit_logs',
        filter: `habit_id=eq.${habitId}`
      }, () => {
        fetchHabitDetails()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(habitsSubscription)
      supabase.removeChannel(logsSubscription)
    }
  }, [habitId])

  const fetchHabitDetails = async () => {
    setIsLoading(true)
    
    try {
      // Fetch habit details
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .single()
      
      if (habitError) {
        throw habitError
      }
      
      setHabit(habitData)
      
      // Fetch habit logs
      const today = new Date()
      const startDate = subDays(today, 30) // Get logs for the last 30 days
      
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false })
      
      if (logsError) {
        throw logsError
      }
      
      setLogs(logsData || [])
      
      // Calculate today's progress
      const todayLogs = logsData?.filter(log => 
        isToday(new Date(log.completed_at))
      ) || []
      
      const progress = habitData 
        ? Math.min(100, (todayLogs.length / habitData.target_count) * 100) 
        : 0
      
      setTodayProgress(progress)
    } catch (error) {
      console.error('Error fetching habit details:', error)
      toast({
        title: "Error",
        description: "Failed to load habit details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logHabit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Check if the habit has already been logged today
      const todayLogs = logs.filter(log => isToday(new Date(log.completed_at)))
      
      if (habit && todayLogs.length >= habit.target_count) {
        toast({
          title: "Already completed",
          description: `You've already reached your daily target of ${habit.target_count} for this habit.`,
        })
        return
      }
      
      // Log the habit
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_at: new Date().toISOString(),
        })
      
      if (error) {
        throw error
      }
      
      // Update the UI
      fetchHabitDetails()
      
      toast({
        title: "Habit logged",
        description: "Your progress has been recorded",
      })
    } catch (error) {
      console.error('Error logging habit:', error)
      toast({
        title: "Error",
        description: "Failed to log habit. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`
    } else {
      return format(date, 'MMM d, yyyy, h:mm a')
    }
  }

  if (isLoading) {
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
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <span className="mr-2">{habit.icon}</span>
          {habit.title}
        </h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Today's Progress
              </div>
              <Button onClick={logHabit}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Log Progress
              </Button>
            </CardTitle>
            <CardDescription>
              {habit.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {logs.filter(log => isToday(new Date(log.completed_at))).length} / {habit.target_count} completed
                </div>
                <div className="text-sm font-medium">
                  {Math.round(todayProgress)}%
                </div>
              </div>
              <Progress value={todayProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Habit Overview
                </CardTitle>
                <CardDescription>
                  Key information about your habit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Frequency</div>
                    <div className="font-medium capitalize">{habit.frequency}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Target</div>
                    <div className="font-medium">{habit.target_count} times per day</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">{format(new Date(habit.created_at), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="font-medium">{format(new Date(habit.updated_at), 'MMM d, yyyy')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <SocialIntegration habit={habit} />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent habit completions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No activity recorded yet. Start logging your progress!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {logs.map(log => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 rounded-md border"
                      >
                        <div>
                          <div className="font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Completed
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(log.completed_at)}
                          </div>
                        </div>
                        {log.notes && (
                          <div className="text-sm max-w-[50%] truncate">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actions" className="mt-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push(`/habits/${habitId}/reminders`)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Set Reminders
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push(`/dashboard/edit-habit/${habitId}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Habit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push(`/dashboard/stats/${habitId}`)}
                    >
                      <BarChart2 className="mr-2 h-4 w-4" />
                      View Statistics
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push(`/achievements?habit=${habitId}`)}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      View Achievements
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your habit progress with friends and the Habito community
                  </p>
                  <Button 
                    className="w-full md:w-auto"
                    onClick={() => router.push(`/social?share=${habitId}`)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
