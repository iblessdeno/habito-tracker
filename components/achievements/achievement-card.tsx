'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle2, Calendar, Award, Users, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    type: string;
    progress: number;
    target: number;
    achieved_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  const isAchieved = !!achievement.achieved_at;
  const progressPercentage = Math.min(100, (achievement.progress / achievement.target) * 100);
  
  // Get appropriate icon based on achievement type
  const getAchievementIcon = () => {
    switch (achievement.type) {
      case 'streak':
        return <TrendingUp className="h-5 w-5" />;
      case 'completion':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'consistency':
        return <Calendar className="h-5 w-5" />;
      case 'milestone':
        return <Award className="h-5 w-5" />;
      case 'social':
        return <Users className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };
  
  // Get color based on achievement type
  const getAchievementColor = () => {
    switch (achievement.type) {
      case 'streak':
        return 'bg-orange-500';
      case 'completion':
        return 'bg-green-500';
      case 'consistency':
        return 'bg-blue-500';
      case 'milestone':
        return 'bg-amber-500';
      case 'social':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        isAchieved ? "border-primary" : "border-muted",
        isHovering && "shadow-lg"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={cn(
        "h-1.5", 
        isAchieved ? "bg-primary" : getAchievementColor(),
        "opacity-60"
      )} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            {achievement.name}
          </CardTitle>
          <div className="flex-shrink-0 text-2xl">
            {achievement.icon || getAchievementIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">
          {achievement.description}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span className="font-medium">
              {achievement.progress} / {achievement.target}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <Badge variant={isAchieved ? "default" : "outline"} className="capitalize">
          {achievement.type}
        </Badge>
        {isAchieved && (
          <span className="text-xs text-muted-foreground">
            Achieved {formatDistanceToNow(new Date(achievement.achieved_at!), { addSuffix: true })}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
