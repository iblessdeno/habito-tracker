"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Achievement } from '@/types/habit-types'
import { AchievementCard } from './achievement-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Award, Star } from 'lucide-react'

interface AchievementsDashboardProps {
  filter?: 'all' | 'completed' | 'in-progress'
}

export function AchievementsDashboard({ filter = 'all' }: AchievementsDashboardProps) {
  const { toast } = useToast()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(filter)

  useEffect(() => {
    fetchAchievements()
    
    // Subscribe to changes in the achievements table
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
  }, [filter])

  const fetchAchievements = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // First, check if the achievements table exists using a safer approach
      try {
        // Check if the achievements table exists
        const { data, error } = await supabase
          .from('achievements')
          .select('count(*)', { count: 'exact', head: true })
        
        if (error) {
          console.log('Achievements table might not exist yet:', error.message)
          setAchievements([])
          setIsLoading(false)
          return
        }
      } catch (tableError) {
        console.log('Error checking achievements table existence:', tableError)
        setAchievements([])
        setIsLoading(false)
        return
      }
      
      // Check if user_achievements table exists
      try {
        const { error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('count(*)', { count: 'exact', head: true })
        
        if (userAchievementsError) {
          console.log('User achievements table might not exist yet:', userAchievementsError.message)
          // We can still show default achievements without user progress
        }
      } catch (tableError) {
        console.log('Error checking user_achievements table existence:', tableError)
        // Continue with default achievements
      }
      
      // All tables exist, proceed with the query
      let query = supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Filter achievements based on the filter prop
      if (filter === 'completed') {
        try {
          // Get completed achievements from user_achievements
          const { data: userAchievements, error: userAchievementsError } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', user.id)
            .eq('completed', true)
          
          if (userAchievementsError) {
            console.log('Error fetching completed achievements:', userAchievementsError.message)
          } else if (userAchievements && userAchievements.length > 0) {
            const completedIds = userAchievements.map(ua => ua.achievement_id)
            query = query.in('id', completedIds)
          } else {
            // No completed achievements
            setAchievements([])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.log('Error in completed achievements filter:', error)
          setAchievements([])
          setIsLoading(false)
          return
        }
      } else if (filter === 'in-progress') {
        try {
          // Get all achievements
          const { data: allAchievements, error: allAchievementsError } = await supabase
            .from('achievements')
            .select('id')
          
          if (allAchievementsError) {
            console.log('Error fetching all achievements:', allAchievementsError.message)
            setAchievements([])
            setIsLoading(false)
            return
          }
          
          // Get completed achievements
          const { data: completedAchievements, error: completedError } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', user.id)
            .eq('completed', true)
          
          if (completedError && !completedError.message.includes('does not exist')) {
            console.log('Error fetching completed achievements:', completedError.message)
          }
          
          // Filter out completed achievements
          const allIds = allAchievements.map(a => a.id)
          const completedIds = completedAchievements ? completedAchievements.map(ca => ca.achievement_id) : []
          const inProgressIds = allIds.filter(id => !completedIds.includes(id))
          
          if (inProgressIds.length > 0) {
            query = query.in('id', inProgressIds)
          } else {
            // All achievements are completed
            setAchievements([])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.log('Error in in-progress achievements filter:', error)
          setAchievements([])
          setIsLoading(false)
          return
        }
      }
      
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      // Get user progress for each achievement
      const achievementsWithProgress = await Promise.all((data || []).map(async (achievement) => {
        try {
          const { data: userAchievement, error: userAchievementError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user.id)
            .eq('achievement_id', achievement.id)
            .maybeSingle()
          
          if (userAchievementError && !userAchievementError.message.includes('does not exist')) {
            console.log(`Error fetching user achievement ${achievement.id}:`, userAchievementError.message)
          }
          
          return {
            ...achievement,
            progress: userAchievement?.progress || 0,
            completed: userAchievement?.completed || false,
            completed_at: userAchievement?.completed_at || null
          }
        } catch (err) {
          console.log(`Error processing achievement ${achievement.id}:`, err)
          return {
            ...achievement,
            progress: 0,
            completed: false,
            completed_at: null
          }
        }
      }))
      
      setAchievements(achievementsWithProgress || [])
    } catch (error) {
      console.error('Error fetching achievements:', error)
      
      // Set empty achievements array to avoid UI issues
      setAchievements([])
      
      // Only show toast for non-table-existence errors
      if (!(error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation') || 
           error.message.includes('undefined')))) {
        toast({
          title: "Error",
          description: "Failed to load achievements. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="mx-auto h-12 w-12 opacity-30 mb-3" />
        <h3 className="text-lg font-medium mb-1">No achievements found</h3>
        <p className="text-sm">
          {filter === 'completed' 
            ? "You haven't completed any achievements yet. Keep working on your habits!" 
            : filter === 'in-progress' 
              ? "No in-progress achievements. Start building habits to earn achievements!" 
              : "Start building habits to earn achievements!"}
        </p>
      </div>
    )
  }

  // Group achievements by type
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const type = achievement.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedAchievements).map(([type, achievements]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            {type === 'streak' && <Trophy className="mr-2 h-5 w-5 text-yellow-500" />}
            {type === 'completion' && <Award className="mr-2 h-5 w-5 text-blue-500" />}
            {type === 'consistency' && <Star className="mr-2 h-5 w-5 text-purple-500" />}
            {type === 'milestone' && <Award className="mr-2 h-5 w-5 text-green-500" />}
            {type.charAt(0).toUpperCase() + type.slice(1)} Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
