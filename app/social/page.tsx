"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialFeed } from '@/components/social/social-feed'
import { FriendsManagement } from '@/components/social/friends-management'
import { Share2, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<string>("feed")
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
        <h1 className="text-2xl font-bold mb-4">Sign in to access social features</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You need to be signed in to view and interact with the social features of Habito.
        </p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Social</h1>
      
      <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="feed" className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Social Feed
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Friends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed">
          <SocialFeed filter="all" />
        </TabsContent>
        
        <TabsContent value="friends">
          <FriendsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
