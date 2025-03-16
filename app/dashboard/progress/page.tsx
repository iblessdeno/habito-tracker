"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart2, Trophy, Calendar, TrendingUp, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Habit, Achievement } from '@/types/habit-types'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface HabitProgress {
  habit: Habit
  completionRate: number
  streak: number
  totalCompletions: number
}

export default function ProgressPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [habitsProgress, setHabitsProgress] = useState<HabitProgress[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("habits")

  useEffect(() => {
    fetchProgressData()
    
    // Subscribe to changes in relevant tables
    const habitsSubscription = supabase
      .channel('habits-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'habits' 
      }, () => {
        fetchProgressData()
      })
      .subscribe()
    
    const logsSubscription = supabase
      .channel('logs-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'habit_logs' 
      }, () => {
        fetchProgressData()
      })
      .subscribe()
    
    const achievementsSubscription = supabase
      .channel('achievements-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'achievements' 
      }, () => {
        fetchProgressData()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(habitsSubscription)
      supabase.removeChannel(logsSubscription)
      supabase.removeChannel(achievementsSubscription)
    }
  }, [])

  const fetchProgressData = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Fetch habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false })
      
      if (habitsError) {
        throw habitsError
      }
      
      // Fetch habit logs
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
      
      if (logsError) {
        throw logsError
      }
      
      // Fetch habit streaks
      const { data: streaks, error: streaksError } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', user.id)
      
      if (streaksError) {
        throw streaksError
      }
      
      // Check if achievements table exists
      const { error: tableCheckError } = await supabase
        .from('achievements')
        .select('id')
        .limit(1)
        .single()
      
      // Only fetch achievements if the table exists
      let achievementsData = []
      if (!tableCheckError || tableCheckError.code !== 'PGRST116') {
        // Fetch achievements
        const { data: achievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (achievementsError) {
          console.warn('Error fetching achievements:', achievementsError)
          // Continue execution even if achievements fetch fails
        } else {
          achievementsData = achievements || []
        }
      }
      
      setAchievements(achievementsData)
      
      // Calculate progress for each habit
      const progressData = (habits || []).map(habit => {
        const habitLogs = (logs || []).filter(log => log.habit_id === habit.id)
        const habitStreak = (streaks || []).find(streak => streak.habit_id === habit.id)
        
        // Calculate completion rate (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentLogs = habitLogs.filter(log => 
          new Date(log.completed_at) >= thirtyDaysAgo
        )
        
        const completionRate = habit.target_count > 0 
          ? Math.min(100, (recentLogs.length / (30 * habit.target_count)) * 100) 
          : 0
        
        return {
          habit,
          completionRate,
          streak: habitStreak?.current_streak || 0,
          totalCompletions: habitLogs.length
        }
      })
      
      // Sort by completion rate (highest first)
      progressData.sort((a, b) => b.completionRate - a.completionRate)
      
      setHabitsProgress(progressData)
    } catch (error) {
      console.error('Error fetching progress data:', error)
      toast({
        title: "Error",
        description: "Failed to load progress data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-emerald-500'
    if (rate >= 40) return 'bg-yellow-500'
    if (rate >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getAchievementProgress = (achievement: Achievement) => {
    return Math.min(100, (achievement.progress / achievement.target) * 100)
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
        <TrendingUp className="mr-3 h-8 w-8" />
        Progress & Achievements
      </h1>
      <p className="text-muted-foreground mb-8">
        Track your habit progress and view your achievements
      </p>
      
      <Tabs defaultValue="habits" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="habits" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Habit Progress
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="habits">
          <div className="grid gap-6">
            {habitsProgress.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="py-12">
                    <BarChart2 className="mx-auto h-12 w-12 opacity-30 mb-3" />
                    <h3 className="text-lg font-medium mb-1">No habits found</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create a habit to start tracking your progress
                    </p>
                    <Button onClick={() => router.push('/dashboard/new-habit')}>
                      Create Habit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              habitsProgress.map(({ habit, completionRate, streak, totalCompletions }) => (
                <Card key={habit.id} className="overflow-hidden">
                  <div 
                    className={`h-2 ${getCompletionRateColor(completionRate)}`} 
                  />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">{habit.icon}</span>
                        {habit.title}
                      </div>
                      <Link href={`/habits/${habit.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {habit.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Completion Rate
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Last 30 days
                          </div>
                          <div className="text-sm font-medium">
                            {Math.round(completionRate)}%
                          </div>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Current Streak
                        </div>
                        <div className="text-2xl font-bold">
                          {streak} {streak === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center">
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Total Completions
                        </div>
                        <div className="text-2xl font-bold">
                          {totalCompletions}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <div className="grid gap-6">
            {achievements.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="py-12">
                    <Trophy className="mx-auto h-12 w-12 opacity-30 mb-3" />
                    <h3 className="text-lg font-medium mb-1">No achievements yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Keep tracking your habits to earn achievements
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                        Completed Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {achievements.filter(a => a.achieved_at !== null).length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Award className="mr-2 h-5 w-5 text-blue-500" />
                        In Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {achievements.filter(a => a.achieved_at === null).length}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-4">
                  {achievements.map(achievement => (
                    <Card key={achievement.id} className={achievement.achieved_at ? 'border-green-200' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                          <span className="mr-2">{achievement.icon}</span>
                          {achievement.title}
                          {achievement.achieved_at && (
                            <Trophy className="ml-2 h-4 w-4 text-yellow-500" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          {achievement.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              {achievement.progress} / {achievement.target}
                            </div>
                            <div className="text-sm font-medium">
                              {Math.round(getAchievementProgress(achievement))}%
                            </div>
                          </div>
                          <Progress 
                            value={getAchievementProgress(achievement)} 
                            className={`h-2 ${achievement.achieved_at ? 'bg-green-100' : ''}`}
                          />
                          {achievement.achieved_at && (
                            <div className="text-sm text-green-600 font-medium pt-1">
                              Completed on {new Date(achievement.achieved_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
            
            <div className="mt-6 text-center">
              <Link href="/achievements">
                <Button variant="outline">
                  <Trophy className="mr-2 h-4 w-4" />
                  View All Achievements
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
