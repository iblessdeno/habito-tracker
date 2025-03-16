"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AchievementsDashboard } from '@/components/achievements/achievements-dashboard'
import { Trophy, Star, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in to view achievements</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You need to be signed in to track and view your achievements.
        </p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
        Achievements
      </h1>
      <p className="text-muted-foreground mb-8">
        Track your progress and earn rewards for building consistent habits
      </p>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <Star className="h-4 w-4 mr-2" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            In Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <AchievementsDashboard filter="all" />
        </TabsContent>
        
        <TabsContent value="completed">
          <AchievementsDashboard filter="completed" />
        </TabsContent>
        
        <TabsContent value="in-progress">
          <AchievementsDashboard filter="in-progress" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
