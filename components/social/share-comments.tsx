"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Comment {
  id: number
  share_id: number
  user_id: string
  content: string
  created_at: string
  profiles: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
}

interface ShareCommentsProps {
  shareId: number
  commentsCount: number
  onCommentAdded?: () => void
}

export function ShareComments({ shareId, commentsCount, onCommentAdded }: ShareCommentsProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getCurrentUser()
      fetchComments()
      
      // Subscribe to changes in the comments table for this share
      const commentsSubscription = supabase
        .channel(`comments-${shareId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'social_comments',
          filter: `share_id=eq.${shareId}`
        }, () => {
          fetchComments()
        })
        .subscribe()
      
      return () => {
        supabase.removeChannel(commentsSubscription)
      }
    }
  }, [open, shareId])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  const fetchComments = async () => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .select(`
          *,
          profiles (id, name, username, avatar_url)
        `)
        .eq('share_id', shareId)
        .order('created_at', { ascending: true })
      
      if (error) {
        throw error
      }
      
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Add comment
      const { error } = await supabase
        .from('social_comments')
        .insert({
          share_id: shareId,
          user_id: user.id,
          content: newComment.trim()
        })
      
      if (error) {
        throw error
      }
      
      // Update comments count in the share
      await supabase
        .from('social_shares')
        .update({ comments_count: commentsCount + 1 })
        .eq('id', shareId)
      
      // Clear input
      setNewComment('')
      
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      // Delete comment
      const { error } = await supabase
        .from('social_comments')
        .delete()
        .eq('id', commentId)
      
      if (error) {
        throw error
      }
      
      // Update comments count in the share
      await supabase
        .from('social_shares')
        .update({ comments_count: Math.max(0, commentsCount - 1) })
        .eq('id', shareId)
      
      // Update local state
      setComments(comments.filter(comment => comment.id !== commentId))
      
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          {commentsCount > 0 && commentsCount}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Comments {commentsCount > 0 && `(${commentsCount})`}
          </DialogTitle>
          <DialogDescription>
            Join the conversation about this share
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="mx-auto h-10 w-10 opacity-30 mb-2" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.profiles.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(comment.profiles.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{comment.profiles.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">@{comment.profiles.username}</span>
                      </div>
                      {comment.user_id === currentUserId && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line">{comment.content}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <Button 
              className="self-end"
              disabled={!newComment.trim() || isSubmitting}
              onClick={handleSubmitComment}
            >
              {isSubmitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Ctrl+Enter to submit
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
