'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface AchievementDisplayProps {
  userId: string;
  limit?: number;
}

export function AchievementDisplay({ userId, limit = 3 }: AchievementDisplayProps) {
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchRecentAchievements = async () => {
      try {
        setLoading(true);
        
        if (!userId) return;
        
        // Fetch recent achievements
        const { data, error } = await supabase
          .from('user_achievements')
          .select('id, name, description, type, achieved_at')
          .eq('profile_id', userId)
          .not('achieved_at', 'is', null)
          .order('achieved_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error('Error fetching recent achievements:', error);
          return;
        }
        
        setRecentAchievements(data || []);
      } catch (error) {
        console.error('Error fetching recent achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentAchievements();
  }, [userId, limit]);
  
  // Get icon based on achievement type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return '🔥';
      case 'completion':
        return '✅';
      case 'consistency':
        return '📅';
      case 'milestone':
        return '🏆';
      case 'social':
        return '👥';
      default:
        return '🌟';
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (recentAchievements.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Award className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Complete habits consistently to earn achievements
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Recent Achievements</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {recentAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center p-4">
              <div className="flex-shrink-0 mr-3 text-2xl">
                {getAchievementIcon(achievement.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
              </div>
              <Badge variant="outline" className="ml-2 capitalize">
                {achievement.type}
              </Badge>
            </div>
          ))}
        </div>
        <div className="p-4 bg-muted/50">
          <Link 
            href="/dashboard/achievements" 
            className="flex items-center justify-center text-sm text-primary hover:underline"
          >
            View all achievements
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
