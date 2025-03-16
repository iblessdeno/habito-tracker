"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Share2, Image, Lock, Globe } from 'lucide-react'

const shareFormSchema = z.object({
  habit_id: z.number(),
  content: z.string().min(1, {
    message: "Share content cannot be empty",
  }).max(500, {
    message: "Share content cannot exceed 500 characters",
  }),
  image_url: z.string().optional(),
  is_public: z.boolean().default(true),
})

type ShareFormValues = z.infer<typeof shareFormSchema>

interface SocialShareFormProps {
  habitId: number
  habitTitle: string
  onSuccess?: () => void
}

export function SocialShareForm({ habitId, habitTitle, onSuccess }: SocialShareFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      habit_id: habitId,
      content: `I'm tracking my "${habitTitle}" habit with Habito!`,
      image_url: '',
      is_public: true,
    },
  })

  const onSubmit = async (data: ShareFormValues) => {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Create share
      const { error } = await supabase
        .from('social_shares')
        .insert({
          user_id: user.id,
          habit_id: data.habit_id,
          content: data.content,
          image_url: data.image_url || null,
          is_public: data.is_public,
        })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Shared successfully",
        description: "Your progress has been shared with the community",
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset form
      form.reset({
        habit_id: habitId,
        content: `I'm tracking my "${habitTitle}" habit with Habito!`,
        image_url: '',
        is_public: true,
      })
      setImagePreview(null)
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: "Error",
        description: "Failed to share your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `share-images/${fileName}`
      
      const { error: uploadError, data } = await supabase.storage
        .from('habito')
        .upload(filePath, file)
      
      if (uploadError) {
        throw uploadError
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('habito')
        .getPublicUrl(filePath)
      
      form.setValue('image_url', publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="mr-2 h-5 w-5" />
          Share Your Progress
        </CardTitle>
        <CardDescription>
          Share your "{habitTitle}" habit progress with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, progress, or tips..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Share your experience with this habit (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full"
                >
                  <Image className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Add Image'}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              
              {imagePreview && (
                <div className="relative rounded-md overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto max-h-[200px] object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null)
                      form.setValue('image_url', '')
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center">
                      {field.value ? (
                        <Globe className="h-4 w-4 mr-2 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      {field.value ? 'Public' : 'Private'}
                    </FormLabel>
                    <FormDescription>
                      {field.value 
                        ? 'Anyone in the Habito community can see this share' 
                        : 'Only you can see this share'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sharing..." : "Share Progress"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
