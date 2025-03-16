"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Award } from 'lucide-react'
import { Achievement, Habit } from '@/types/habit-types'
import { Spinner } from '@/components/ui/spinner'

interface AchievementTrackerProps {
  habitId?: number
  userId?: string
}

export function AchievementTracker({ habitId, userId }: AchievementTrackerProps) {
  const { toast } = useToast()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [habit, setHabit] = useState<Habit | null>(null)

  useEffect(() => {
    fetchAchievements()
    
    if (habitId) {
      fetchHabitDetails()
    }
    
    // Subscribe to changes in achievements
    const achievementsSubscription = supabase
      .channel('achievements-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'achievements' 
      }, () => {
        fetchAchievements()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(achievementsSubscription)
    }
  }, [habitId, userId])

  const fetchHabitDetails = async () => {
    try {
      if (!habitId) return
      
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
      console.error('Error fetching habit details:', error)
    }
  }

  const fetchAchievements = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user && !userId) {
        throw new Error('User not authenticated')
      }
      
      const currentUserId = userId || user.id
      
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('user_id', currentUserId)
        .order('progress', { ascending: false })
      
      // If habitId is provided, filter achievements related to this habit
      if (habitId) {
        query = query.eq('habit_id', habitId)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      setAchievements(data || [])
    } catch (error) {
      console.error('Error fetching achievements:', error)
      toast({
        title: "Error",
        description: "Failed to load achievements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min(100, (achievement.progress / achievement.target) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-8">
            <Trophy className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <h3 className="text-lg font-medium mb-1">No achievements yet</h3>
            <p className="text-sm text-muted-foreground">
              {habitId 
                ? "Keep tracking this habit to earn achievements" 
                : "Start tracking habits to earn achievements"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {habitId && habit && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-primary" />
              {habit.title} Achievements
            </CardTitle>
            <CardDescription>
              Track your progress and earn rewards
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <div className="grid gap-4">
        {achievements.map(achievement => (
          <Card key={achievement.id} className={achievement.achieved_at ? 'border-green-200' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <span className="mr-2">{achievement.icon || '🏆'}</span>
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
                    {Math.round(getProgressPercentage(achievement))}%
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(achievement)} 
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
    </div>
  )
}
