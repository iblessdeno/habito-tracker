"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HabitShareButton } from './habit-share-button'
import { SocialFeed } from './social-feed'
import { Share2, Trophy, Bell } from 'lucide-react'
import { Habit } from '@/types/habit-types'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SocialIntegrationProps {
  habit: Habit
}

export function SocialIntegration({ habit }: SocialIntegrationProps) {
  const [activeTab, setActiveTab] = useState<string>("shares")
  const router = useRouter()

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Social & Community
          </div>
          <HabitShareButton habit={habit} size="sm" />
        </CardTitle>
        <CardDescription>
          Share your progress and see what others are doing with this habit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="shares" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shares" className="flex items-center">
              <Share2 className="h-4 w-4 mr-2" />
              Related Shares
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Community
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="shares" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm">
                See what others are sharing about this habit:
              </div>
              <div className="h-[400px] overflow-y-auto pr-2">
                <SocialFeed filter="all" habitId={habit.id} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm">
                Connect with others who are working on the same habit:
              </div>
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/social')}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Visit Social Hub
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/achievements')}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  View Achievements
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/habits/${habit.id}/reminders`)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Set Reminders
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
