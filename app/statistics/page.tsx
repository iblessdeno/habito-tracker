"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/components/ui/use-toast'
import { HabitInsights } from '@/components/analytics/habit-insights'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, BarChart, PieChart } from '@/components/ui/charts'

export default function StatisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [habitStats, setHabitStats] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const { toast } = useToast()

  useEffect(() => {
    fetchHabitStatistics()
  }, [selectedPeriod])

  const fetchHabitStatistics = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // First, check if the required tables exist
      try {
        const { error } = await supabase
          .from('habits')
          .select('count(*)', { count: 'exact', head: true })
        
        if (error) {
          console.log('Habits table might not exist yet:', error.message)
          setIsLoading(false)
          return
        }
      } catch (tableError) {
        console.log('Error checking table existence:', tableError)
        setIsLoading(false)
        return
      }
      
      // Get habit completion statistics
      const { data: habitLogs, error: habitLogsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', getPeriodStartDate(selectedPeriod))
      
      if (habitLogsError && !habitLogsError.message.includes('does not exist')) {
        console.error('Error fetching habit logs:', habitLogsError)
      }
      
      // Get all user habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
      
      if (habitsError) {
        console.error('Error fetching habits:', habitsError)
      }
      
      // Calculate statistics
      const stats = calculateStatistics(habits || [], habitLogs || [])
      setHabitStats(stats)
    } catch (error) {
      console.error('Error fetching statistics:', error)
      
      if (!(error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation') || 
           error.message.includes('undefined')))) {
        toast({
          title: "Error",
          description: "Failed to load statistics. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const getPeriodStartDate = (period: string) => {
    const now = new Date()
    switch (period) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        return weekStart.toISOString()
      case 'month':
        const monthStart = new Date(now)
        monthStart.setMonth(now.getMonth() - 1)
        return monthStart.toISOString()
      case 'year':
        const yearStart = new Date(now)
        yearStart.setFullYear(now.getFullYear() - 1)
        return yearStart.toISOString()
      default:
        const defaultStart = new Date(now)
        defaultStart.setDate(now.getDate() - 7)
        return defaultStart.toISOString()
    }
  }
  
  const calculateStatistics = (habits: any[], habitLogs: any[]) => {
    // Group logs by habit
    const logsByHabit = habitLogs.reduce((acc, log) => {
      if (!acc[log.habit_id]) {
        acc[log.habit_id] = []
      }
      acc[log.habit_id].push(log)
      return acc
    }, {})
    
    // Calculate completion rates
    const completionRates = habits.map(habit => {
      const logs = logsByHabit[habit.id] || []
      const completionRate = habit.target_count > 0 
        ? Math.min(100, (logs.length / habit.target_count) * 100) 
        : logs.length > 0 ? 100 : 0
      
      return {
        name: habit.title,
        value: Math.round(completionRate),
        color: habit.color || '#4f46e5'
      }
    })
    
    // Calculate daily completion counts
    const dailyCounts = getDailyCompletionCounts(habitLogs)
    
    // Calculate streak information
    const streakInfo = calculateStreakInfo(habits, habitLogs)
    
    return {
      totalHabits: habits.length,
      totalCompletions: habitLogs.length,
      averageCompletionRate: completionRates.length > 0 
        ? Math.round(completionRates.reduce((sum, item) => sum + item.value, 0) / completionRates.length) 
        : 0,
      completionRates,
      dailyCounts,
      streakInfo,
      habitsByCategory: categorizeHabits(habits),
      habits: habits,
      habitLogs: habitLogs
    }
  }
  
  const getDailyCompletionCounts = (habitLogs: any[]) => {
    const counts: Record<string, number> = {}
    const now = new Date()
    const startDate = new Date(getPeriodStartDate(selectedPeriod))
    
    // Initialize all dates in the period with 0
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      counts[dateStr] = 0
    }
    
    // Count completions by date
    habitLogs.forEach(log => {
      const dateStr = new Date(log.completed_at).toISOString().split('T')[0]
      if (counts[dateStr] !== undefined) {
        counts[dateStr]++
      }
    })
    
    // Convert to array format for charts
    return Object.entries(counts).map(([date, count]) => ({
      date,
      count
    }))
  }
  
  const calculateStreakInfo = (habits: any[], habitLogs: any[]) => {
    // This is a placeholder for more complex streak calculations
    // In a real implementation, you would track consecutive days of completion
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: new Set(habitLogs.map(log => 
        new Date(log.completed_at).toISOString().split('T')[0]
      )).size
    }
  }
  
  const categorizeHabits = (habits: any[]) => {
    // This is a placeholder for categorizing habits
    // In a real implementation, you would have categories in the habit model
    
    const categories: Record<string, number> = {
      'Health': 0,
      'Productivity': 0,
      'Learning': 0,
      'Other': 0
    }
    
    habits.forEach(habit => {
      // Simple categorization based on keywords in title or description
      const text = (habit.title + ' ' + (habit.description || '')).toLowerCase()
      
      if (text.includes('exercise') || text.includes('workout') || text.includes('health') || text.includes('sleep')) {
        categories['Health']++
      } else if (text.includes('work') || text.includes('study') || text.includes('task') || text.includes('project')) {
        categories['Productivity']++
      } else if (text.includes('read') || text.includes('learn') || text.includes('practice') || text.includes('course')) {
        categories['Learning']++
      } else {
        categories['Other']++
      }
    })
    
    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        name: category,
        value: count
      }))
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">
          Track your habit progress and get insights into your performance
        </p>
      </div>
      
      <Tabs defaultValue="week" onValueChange={setSelectedPeriod}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="week" className="mt-0">
          <StatisticsContent isLoading={isLoading} stats={habitStats} period="week" />
        </TabsContent>
        
        <TabsContent value="month" className="mt-0">
          <StatisticsContent isLoading={isLoading} stats={habitStats} period="month" />
        </TabsContent>
        
        <TabsContent value="year" className="mt-0">
          <StatisticsContent isLoading={isLoading} stats={habitStats} period="year" />
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Habit Insights</CardTitle>
          <CardDescription>
            Detailed analysis of your habit performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {habitStats?.habits?.map((habit: any) => (
            <HabitInsights 
              key={habit.id}
              habitId={habit.id}
              logs={habitStats.habitLogs || []}
            />
          ))}
          {!habitStats?.habits?.length && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No habits to analyze yet. Start by creating some habits!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface StatisticsContentProps {
  isLoading: boolean
  stats: any
  period: string
}

function StatisticsContent({ isLoading, stats, period }: StatisticsContentProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No statistics available. Start tracking your habits to see insights!</p>
      </div>
    )
  }
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHabits}</div>
            <p className="text-xs text-muted-foreground">
              Active habits you're currently tracking
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Total habit completions this {period}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion rate across all habits
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streakInfo.totalDaysActive}</div>
            <p className="text-xs text-muted-foreground">
              Days with at least one habit completed
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>
              Your habit completions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.dailyCounts.length > 0 ? (
              <LineChart 
                data={stats.dailyCounts}
                xKey="date"
                yKey="count"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Habit Distribution</CardTitle>
            <CardDescription>
              Your habits by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.habitsByCategory.length > 0 ? (
              <PieChart 
                data={stats.habitsByCategory}
                nameKey="name"
                valueKey="value"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Completion Rates</CardTitle>
            <CardDescription>
              How well you're doing with each habit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.completionRates.length > 0 ? (
              <BarChart 
                data={stats.completionRates}
                xKey="name"
                yKey="value"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
