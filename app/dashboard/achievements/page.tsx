'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Award, Trophy, Flame, Star, Check, Calendar, Users, Target } from 'lucide-react';
import { AchievementCard } from '@/components/achievements/achievement-card';

// Define achievement types
const ACHIEVEMENT_TYPES = {
  STREAK: 'streak',
  COMPLETION: 'completion',
  CONSISTENCY: 'consistency',
  MILESTONE: 'milestone',
  SOCIAL: 'social'
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState({ level: 1, points: 0, nextLevel: 100 });
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        // Fetch achievements
        const { data: achievementsData, error } = await supabase
          .from('user_achievements')
          .select('id, name, description, icon, type, progress, target, achieved_at, created_at, updated_at, profile_id')
          .eq('profile_id', user.id)
          .order('type', { ascending: true })
          .order('target', { ascending: true });
          
        if (error) {
          console.error('Error fetching achievements:', error);
          return;
        }
        
        setAchievements(achievementsData || []);
        
        // Calculate user rank based on achievements
        if (achievementsData) {
          const completedAchievements = achievementsData.filter(a => a.achieved_at);
          const points = completedAchievements.reduce((sum, a) => {
            // Different achievement types give different points
            const pointsMap: Record<string, number> = {
              [ACHIEVEMENT_TYPES.STREAK]: 10,
              [ACHIEVEMENT_TYPES.COMPLETION]: 5,
              [ACHIEVEMENT_TYPES.CONSISTENCY]: 15,
              [ACHIEVEMENT_TYPES.MILESTONE]: 20,
              [ACHIEVEMENT_TYPES.SOCIAL]: 8
            };
            
            return sum + (pointsMap[a.type] || 5);
          }, 0);
          
          // Calculate level (every 100 points = 1 level)
          const level = Math.max(1, Math.floor(points / 100) + 1);
          const nextLevelPoints = level * 100;
          
          setUserRank({
            level,
            points,
            nextLevel: nextLevelPoints
          });
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, []);
  
  // Group achievements by type
  const achievementsByType = achievements.reduce((acc: Record<string, any[]>, achievement) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {});
  
  // Get icon based on achievement type
  const getAchievementTypeIcon = (type: string) => {
    switch (type) {
      case ACHIEVEMENT_TYPES.STREAK:
        return <Flame className="h-5 w-5 text-orange-500" />;
      case ACHIEVEMENT_TYPES.COMPLETION:
        return <Check className="h-5 w-5 text-green-500" />;
      case ACHIEVEMENT_TYPES.CONSISTENCY:
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case ACHIEVEMENT_TYPES.MILESTONE:
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case ACHIEVEMENT_TYPES.SOCIAL:
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  // Get achievement type label
  const getAchievementTypeLabel = (type: string) => {
    switch (type) {
      case ACHIEVEMENT_TYPES.STREAK:
        return 'Streak';
      case ACHIEVEMENT_TYPES.COMPLETION:
        return 'Completion';
      case ACHIEVEMENT_TYPES.CONSISTENCY:
        return 'Consistency';
      case ACHIEVEMENT_TYPES.MILESTONE:
        return 'Milestone';
      case ACHIEVEMENT_TYPES.SOCIAL:
        return 'Social';
      default:
        return 'Other';
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and earn rewards for building habits
          </p>
        </div>
      </header>
      
      {/* User Rank Card */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Level {userRank.level}</h2>
                <p className="text-white/80">
                  {userRank.points} / {userRank.nextLevel} points
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <Progress 
                value={(userRank.points % 100) * 100 / 100} 
                className="h-3 bg-white/20" 
              />
              <p className="text-sm text-white/80 mt-1 text-center">
                {100 - (userRank.points % 100)} points until next level
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Achievements Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>All</span>
          </TabsTrigger>
          <TabsTrigger value={ACHIEVEMENT_TYPES.STREAK} className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <span>Streaks</span>
          </TabsTrigger>
          <TabsTrigger value={ACHIEVEMENT_TYPES.COMPLETION} className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Completions</span>
          </TabsTrigger>
          <TabsTrigger value={ACHIEVEMENT_TYPES.CONSISTENCY} className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Consistency</span>
          </TabsTrigger>
          <TabsTrigger value={ACHIEVEMENT_TYPES.MILESTONE} className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Milestones</span>
          </TabsTrigger>
          <TabsTrigger value={ACHIEVEMENT_TYPES.SOCIAL} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Social</span>
          </TabsTrigger>
        </TabsList>
        
        {/* All Achievements */}
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : achievements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Start building habits consistently to unlock achievements and level up your ranking!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Achievement Type Tabs */}
        {Object.values(ACHIEVEMENT_TYPES).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : !achievementsByType[type] || achievementsByType[type].length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {getAchievementTypeIcon(type)}
                  <h3 className="text-xl font-semibold mt-4 mb-2">No {getAchievementTypeLabel(type)} Achievements Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Keep building your habits to unlock {getAchievementTypeLabel(type).toLowerCase()} achievements!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievementsByType[type]?.map((achievement) => (
                  <AchievementCard 
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
