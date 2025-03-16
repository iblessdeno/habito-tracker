"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react'
import { Habit } from '@/types/habit-types'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ShareHabitProps {
  habit: Habit
  onShareSuccess?: () => void
}

export function ShareHabit({ habit, onShareSuccess }: ShareHabitProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  
  const shareToFeed = async () => {
    setIsSharing(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Create a share record in the database
      const { error } = await supabase
        .from('shares')
        .insert({
          user_id: user.id,
          habit_id: habit.id,
          message: message.trim(),
          share_type: 'feed'
        })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Shared successfully",
        description: "Your habit has been shared to your feed",
      })
      
      // Reset form and close dialog
      setMessage('')
      setIsOpen(false)
      
      // Call the success callback if provided
      if (onShareSuccess) {
        onShareSuccess()
      }
    } catch (error) {
      console.error('Error sharing habit:', error)
      toast({
        title: "Error",
        description: "Failed to share habit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }
  
  const generateShareUrl = () => {
    // Create a shareable URL for the habit
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/habits/${habit.id}?shared=true`
  }
  
  const copyShareLink = async () => {
    const shareUrl = generateShareUrl()
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
      })
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setLinkCopied(false)
      }, 3000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const shareToTwitter = () => {
    const shareUrl = generateShareUrl()
    const text = message || `Check out my habit "${habit.title}" on Habito!`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank')
  }
  
  const shareToFacebook = () => {
    const shareUrl = generateShareUrl()
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, '_blank')
  }
  
  const shareToLinkedIn = () => {
    const shareUrl = generateShareUrl()
    const text = message || `Check out my habit "${habit.title}" on Habito!`
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`
    window.open(linkedinUrl, '_blank')
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Habit</DialogTitle>
          <DialogDescription>
            Share your habit progress with friends or on social media
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="p-4">
              <div className="font-medium">{habit.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{habit.description}</div>
            </CardContent>
          </Card>
          
          <Textarea
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
            rows={3}
          />
          
          <Tabs defaultValue="feed">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">Habito Feed</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Share your habit with your friends on Habito
              </p>
              
              <Button 
                onClick={shareToFeed} 
                disabled={isSharing} 
                className="w-full"
              >
                {isSharing ? "Sharing..." : "Share to Feed"}
              </Button>
            </TabsContent>
            
            <TabsContent value="social" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  onClick={shareToTwitter}
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Twitter
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  onClick={shareToFacebook}
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  onClick={shareToLinkedIn}
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  LinkedIn
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`flex items-center justify-center gap-2 ${linkCopied ? 'border-green-500 text-green-500' : ''}`}
                  onClick={copyShareLink}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
