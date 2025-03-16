"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, UserCheck, UserX, Search, Clock } from 'lucide-react'
import { Friend } from '@/types/habit-types'

interface FriendWithProfile extends Friend {
  profiles: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
}

interface FriendRequest {
  id: number
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  profiles: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
}

export function FriendsManagement() {
  const { toast } = useToast()
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("friends")

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends()
    } else if (activeTab === 'requests') {
      fetchRequests()
    }
    
    // Subscribe to changes in the friends table
    const friendsSubscription = supabase
      .channel('friends-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friends' 
      }, () => {
        if (activeTab === 'friends') {
          fetchFriends()
        } else if (activeTab === 'requests') {
          fetchRequests()
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(friendsSubscription)
    }
  }, [activeTab])

  const fetchFriends = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Get accepted friends where the user is either the requester or the receiver
      const { data: sentFriends, error: sentError } = await supabase
        .from('friends')
        .select(`
          *,
          profiles!friends_friend_id_fkey (id, name, username, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
      
      if (sentError) {
        throw sentError
      }
      
      const { data: receivedFriends, error: receivedError } = await supabase
        .from('friends')
        .select(`
          *,
          profiles!friends_user_id_fkey (id, name, username, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'accepted')
      
      if (receivedError) {
        throw receivedError
      }
      
      // Combine and format the results
      const formattedSentFriends = sentFriends.map(friend => ({
        ...friend,
        profiles: friend.profiles
      }))
      
      const formattedReceivedFriends = receivedFriends.map(friend => ({
        ...friend,
        // Swap the user_id and friend_id for consistency in the UI
        user_id: friend.friend_id,
        friend_id: friend.user_id,
        profiles: friend.profiles
      }))
      
      setFriends([...formattedSentFriends, ...formattedReceivedFriends])
    } catch (error) {
      console.error('Error fetching friends:', error)
      toast({
        title: "Error",
        description: "Failed to load friends. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequests = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Get pending friend requests sent to the user
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          profiles!friends_user_id_fkey (id, name, username, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
      
      if (error) {
        throw error
      }
      
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching friend requests:', error)
      toast({
        title: "Error",
        description: "Failed to load friend requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Search for users by name or username
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq('id', user.id) // Exclude current user
        .limit(10)
      
      if (error) {
        throw error
      }
      
      // Check if the user already has a friend relationship with each result
      const resultsWithStatus = await Promise.all((data || []).map(async (profile) => {
        // Check if there's a friend request from the current user to this profile
        const { data: sentRequest } = await supabase
          .from('friends')
          .select('status')
          .eq('user_id', user.id)
          .eq('friend_id', profile.id)
          .single()
        
        // Check if there's a friend request from this profile to the current user
        const { data: receivedRequest } = await supabase
          .from('friends')
          .select('status')
          .eq('user_id', profile.id)
          .eq('friend_id', user.id)
          .single()
        
        let status = null
        if (sentRequest) {
          status = sentRequest.status
        } else if (receivedRequest) {
          status = receivedRequest.status === 'pending' ? 'received' : receivedRequest.status
        }
        
        return {
          ...profile,
          status
        }
      }))
      
      setSearchResults(resultsWithStatus)
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Create a friend request
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })
      
      if (error) {
        throw error
      }
      
      // Update search results
      setSearchResults(searchResults.map(result => 
        result.id === friendId ? { ...result, status: 'pending' } : result
      ))
      
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully",
      })
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      // Update the friend request status to accepted
      const { error } = await supabase
        .from('friends')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setRequests(requests.filter(req => req.id !== requestId))
      
      toast({
        title: "Friend request accepted",
        description: "You are now friends with this user",
      })
      
      // Refresh friends list
      fetchFriends()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    try {
      // Update the friend request status to rejected
      const { error } = await supabase
        .from('friends')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setRequests(requests.filter(req => req.id !== requestId))
      
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected",
      })
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Delete the friend relationship (both directions)
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId)
      
      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id)
      
      if (error1 || error2) {
        throw error1 || error2
      }
      
      // Update local state
      setFriends(friends.filter(friend => 
        friend.profiles.id !== friendId
      ))
      
      toast({
        title: "Friend removed",
        description: "This user has been removed from your friends",
      })
    } catch (error) {
      console.error('Error removing friend:', error)
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="mr-2 h-6 w-6" />
          Friends
        </h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Find Friends</CardTitle>
          <CardDescription>
            Search for other Habito users to add as friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name or username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">@{result.username}</div>
                    </div>
                  </div>
                  <div>
                    {result.status === 'accepted' ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFriend(result.id)}>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Friends
                      </Button>
                    ) : result.status === 'pending' ? (
                      <Button variant="outline" size="sm" disabled>
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </Button>
                    ) : result.status === 'received' ? (
                      <div className="flex space-x-2">
                        <Button variant="default" size="sm">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button variant="outline" size="sm">
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => handleSendRequest(result.id)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="friends" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends" className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            My Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Friend Requests
            {requests.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-6">
          {renderFriends()}
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          {renderRequests()}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderFriends() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )
    }
    
    if (friends.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <h3 className="text-lg font-medium mb-1">No friends yet</h3>
          <p className="text-sm">
            Search for users and send friend requests to connect with others
          </p>
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {friends.map((friend) => (
          <Card key={friend.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={friend.profiles.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(friend.profiles.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{friend.profiles.name}</div>
                    <div className="text-sm text-muted-foreground">@{friend.profiles.username}</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveFriend(friend.profiles.id)}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function renderRequests() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )
    }
    
    if (requests.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <h3 className="text-lg font-medium mb-1">No pending friend requests</h3>
          <p className="text-sm">
            When someone sends you a friend request, it will appear here
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={request.profiles.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(request.profiles.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{request.profiles.name}</div>
                    <div className="text-sm text-muted-foreground">@{request.profiles.username}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}
