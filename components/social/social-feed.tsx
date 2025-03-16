"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeartIcon, MessageSquare, MoreHorizontal, Share2, Trash2, Users } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth-context'

interface SocialFeedProps {
  filter?: 'all' | 'friends' | 'mine'
  habitId?: number
}

interface ShareWithProfile {
  id: number
  user_id: string
  habit_id: number
  message: string
  likes_count: number
  comments_count: number
  created_at: string
  image_url?: string
  profiles: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
  habits: {
    id: number
    title: string
    color: string
    icon: string
  }
  liked: boolean
}

export function SocialFeed({ filter = 'all', habitId }: SocialFeedProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [shares, setShares] = useState<ShareWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(filter)
  
  useEffect(() => {
    if (user) {
      fetchShares(activeTab)
    }
    
    // Subscribe to changes in shares
    const sharesSubscription = supabase
      .channel('shares-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shares' 
      }, () => {
        fetchShares(activeTab)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(sharesSubscription)
    }
  }, [user, activeTab, habitId])
  
  const fetchShares = async (filterType: string = 'all') => {
    if (!user) return
    
    setIsLoading(true)
    setShares([]) // Reset shares to prevent stale data
    
    try {
      // First, check if the required tables exist using a safer approach
      try {
        // Check if the shares table exists in a safer way
        const { data, error } = await supabase
          .from('shares')
          .select('count(*)', { count: 'exact', head: true })
        
        if (error) {
          console.log('Shares table might not exist yet:', error.message)
          setIsLoading(false)
          return
        }
      } catch (tableError) {
        console.log('Error checking table existence:', tableError)
        setIsLoading(false)
        return
      }
      
      // All tables exist, proceed with the query
      let query = supabase
        .from('shares')
        .select(`
          *,
          profiles (id, name, username, avatar_url),
          habits (id, title, color, icon)
        `)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filterType === 'mine') {
        query = query.eq('user_id', user.id)
      } else if (filterType === 'friends') {
        try {
          // Get user's friends
          const { data: friends, error: friendsError } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', user.id)
            .eq('status', 'accepted')
          
          if (friendsError) {
            console.log('Friends table might not exist yet:', friendsError.message)
            // Fall back to showing only user's shares
            query = query.eq('user_id', user.id)
          } else if (friends && friends.length > 0) {
            const friendIds = friends.map(f => f.friend_id)
            query = query.in('user_id', [...friendIds, user.id])
          } else {
            // No friends, show only user's shares
            query = query.eq('user_id', user.id)
          }
        } catch (friendsError) {
          console.log('Error fetching friends:', friendsError)
          query = query.eq('user_id', user.id)
        }
      }
      
      // Filter by habit if provided
      if (habitId) {
        query = query.eq('habit_id', habitId)
      }
      
      const { data: shares, error } = await query.limit(20)
      
      if (error) {
        throw error
      }
      
      if (!shares || shares.length === 0) {
        setShares([])
        setIsLoading(false)
        return
      }
      
      // Add liked status to each share
      const sharesWithLikeStatus = await Promise.all(shares.map(async (share) => {
        try {
          const { data: likeData, error: likeError } = await supabase
            .from('share_likes')
            .select('*')
            .eq('share_id', share.id)
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (likeError) {
            console.log(`Share likes table might not exist yet:`, likeError.message)
            return {
              ...share,
              liked: false
            }
          }
          
          return {
            ...share,
            liked: !!likeData
          }
        } catch (err) {
          console.warn(`Error checking like status for share ${share.id}:`, err)
          return {
            ...share,
            liked: false
          }
        }
      }))
      
      setShares(sharesWithLikeStatus as ShareWithProfile[])
    } catch (error) {
      console.error('Error fetching shares:', error)
      
      // Set empty shares array to avoid UI issues
      setShares([])
      
      // Only show toast for non-table-existence errors
      if (!(error instanceof Error && 
          (error.message.includes('does not exist') || 
           error.message.includes('relation') || 
           error.message.includes('undefined')))) {
        toast({
          title: "Error",
          description: "Failed to load social feed. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (shareId: number, isLiked: boolean) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      if (isLiked) {
        // Unlike
        await supabase
          .from('share_likes')
          .delete()
          .eq('share_id', shareId)
          .eq('user_id', user.id)
        
        // Update likes count in the share
        await supabase
          .from('shares')
          .update({ likes_count: Math.max(0, shares.find(s => s.id === shareId)?.likes_count! - 1) })
          .eq('id', shareId)
      } else {
        // Like
        await supabase
          .from('share_likes')
          .insert({
            share_id: shareId,
            user_id: user.id
          })
        
        // Update likes count in the share
        await supabase
          .from('shares')
          .update({ likes_count: (shares.find(s => s.id === shareId)?.likes_count || 0) + 1 })
          .eq('id', shareId)
      }
      
      // Update local state
      setShares(shares.map(share => 
        share.id === shareId 
          ? { 
              ...share, 
              liked: !isLiked,
              likes_count: isLiked 
                ? Math.max(0, share.likes_count - 1) 
                : share.likes_count + 1
            } 
          : share
      ))
    } catch (error) {
      console.error('Error liking/unliking share:', error)
      toast({
        title: "Error",
        description: "Failed to like/unlike. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteShare = async (shareId: number) => {
    try {
      // Delete share
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setShares(shares.filter(share => share.id !== shareId))
      
      toast({
        title: "Share deleted",
        description: "Your share has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting share:', error)
      toast({
        title: "Error",
        description: "Failed to delete share. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // If habitId is provided, don't show the tabs
  if (habitId) {
    return (
      <div className="space-y-4">
        {renderShares()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Share2 className="mr-2 h-6 w-6" />
          Social Feed
        </h2>
      </div>
      
      <Tabs defaultValue={filter} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center">
            <Avatar className="h-4 w-4 mr-2">
              <AvatarFallback className="text-[8px]">ME</AvatarFallback>
            </Avatar>
            My Shares
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {renderShares()}
        </TabsContent>
        <TabsContent value="friends" className="mt-6">
          {renderShares()}
        </TabsContent>
        <TabsContent value="mine" className="mt-6">
          {renderShares()}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderShares() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )
    }
    
    if (shares.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Share2 className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <h3 className="text-lg font-medium mb-1">No shares found</h3>
          <p className="text-sm">
            {habitId 
              ? "Be the first to share your progress with this habit!" 
              : activeTab === "friends" 
                ? "Add friends or create your own shares to see content here!" 
                : activeTab === "mine" 
                  ? "You haven't shared any habits yet. Share your progress!" 
                  : "Be the first to share your habit progress with the community!"}
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {shares.map(share => (
          <Card key={share.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={share.profiles.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(share.profiles.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{share.profiles.name}</div>
                  <div className="text-sm text-muted-foreground">@{share.profiles.username}</div>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2" 
                  style={{ 
                    backgroundColor: share.habits.color ? `${share.habits.color}30` : 'var(--secondary)',
                    color: share.habits.color || 'var(--secondary-foreground)'
                  }}>
                  {share.habits.icon && <span className="mr-1">{share.habits.icon}</span>}
                  {share.habits.title}
                </div>
              </div>
              <p className="whitespace-pre-line">{share.message}</p>
              {share.image_url && (
                <div className="mt-3 rounded-md overflow-hidden">
                  <img 
                    src={share.image_url} 
                    alt="Shared image" 
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={share.liked ? "text-red-500" : ""}
                  onClick={() => handleLike(share.id, share.liked)}
                >
                  <HeartIcon className={`h-4 w-4 mr-1 ${share.liked ? "fill-red-500" : ""}`} />
                  {share.likes_count > 0 && share.likes_count}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteShare(share.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}
