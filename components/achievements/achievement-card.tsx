"use client"

import { Achievement } from '@/types/habit-types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Award, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isAchieved = achievement.achieved_at !== null
  const progressPercentage = Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
  
  const getAchievementIcon = () => {
    switch (achievement.type) {
      case 'streak':
        return <TrendingUp className="h-5 w-5" />
      case 'completion':
        return <CheckCircle2 className="h-5 w-5" />
      case 'consistency':
        return <Clock className="h-5 w-5" />
      case 'milestone':
        return <Trophy className="h-5 w-5" />
      default:
        return <Award className="h-5 w-5" />
    }
  }
  
  const getAchievementTypeLabel = () => {
    switch (achievement.type) {
      case 'streak':
        return 'Streak'
      case 'completion':
        return 'Completion'
      case 'consistency':
        return 'Consistency'
      case 'milestone':
        return 'Milestone'
      default:
        return 'Achievement'
    }
  }
  
  return (
    <Card className={cn(
      "transition-all duration-300",
      isAchieved ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background" : ""
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <span className={cn(
              "mr-2 p-1.5 rounded-full",
              isAchieved ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-muted text-muted-foreground"
            )}>
              {getAchievementIcon()}
            </span>
            {achievement.title}
          </CardTitle>
          {isAchieved && (
            <Badge variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-400">
              <Star className="h-3 w-3 mr-1 fill-yellow-500" />
              Achieved
            </Badge>
          )}
        </div>
        <CardDescription>
          {achievement.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getAchievementTypeLabel()}</span>
            <span className="font-medium">{achievement.progress} / {achievement.target}</span>
          </div>
          <Progress value={progressPercentage} className={isAchieved ? "bg-muted" : ""} />
        </div>
      </CardContent>
      {isAchieved && (
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          Achieved on {new Date(achievement.achieved_at!).toLocaleDateString()}
        </CardFooter>
      )}
    </Card>
  )
}
