'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface AchievementCardProps {
  achievement: {
    id: number;
    title: string;
    description?: string;
    icon?: string;
    achieved_at: string | null;
    progress: number;
    target: number;
    type: string;
  };
  icon?: ReactNode;
}

export function AchievementCard({ achievement, icon }: AchievementCardProps) {
  const isCompleted = !!achievement.achieved_at;
  const progressPercentage = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
  
  // Get achievement icon based on type if not provided
  const getDefaultIcon = () => {
    return achievement.icon || '🏆';
  };
  
  // Get achievement color based on type
  const getTypeColor = () => {
    switch (achievement.type) {
      case 'streak':
        return 'bg-orange-100 text-orange-800';
      case 'completion':
        return 'bg-green-100 text-green-800';
      case 'consistency':
        return 'bg-blue-100 text-blue-800';
      case 'milestone':
        return 'bg-amber-100 text-amber-800';
      case 'social':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${isCompleted ? 'border-green-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            {icon || getDefaultIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg">{achievement.title}</h3>
              <Badge variant="outline" className={getTypeColor()}>
                {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
              </Badge>
            </div>
            {achievement.description && (
              <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{achievement.progress} / {achievement.target}</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className={`px-6 py-3 bg-gray-50 ${isCompleted ? 'bg-green-50' : ''}`}>
        {isCompleted ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-green-600">Completed!</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(achievement.achieved_at!), { addSuffix: true })}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium">In progress</span>
            <span className="text-xs text-muted-foreground">
              {achievement.target - achievement.progress} more to go
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
