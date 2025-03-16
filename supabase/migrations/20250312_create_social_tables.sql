-- Create social shares table
CREATE TABLE IF NOT EXISTS public.social_shares (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- Create social comments table
CREATE TABLE IF NOT EXISTS public.social_comments (
    id SERIAL PRIMARY KEY,
    share_id INTEGER NOT NULL REFERENCES public.social_shares(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social likes table
CREATE TABLE IF NOT EXISTS public.social_likes (
    id SERIAL PRIMARY KEY,
    share_id INTEGER NOT NULL REFERENCES public.social_shares(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(share_id, user_id)
);

-- Add RLS policies for social_shares
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select public shares or their own shares
CREATE POLICY "Users can view public shares or their own shares" 
ON public.social_shares FOR SELECT 
USING (is_public OR auth.uid() = user_id);

-- Policy to allow users to insert their own shares
CREATE POLICY "Users can insert their own shares" 
ON public.social_shares FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own shares
CREATE POLICY "Users can update their own shares" 
ON public.social_shares FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own shares
CREATE POLICY "Users can delete their own shares" 
ON public.social_shares FOR DELETE 
USING (auth.uid() = user_id);

-- Add RLS policies for friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own friend connections
CREATE POLICY "Users can view their own friend connections" 
ON public.friends FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy to allow users to insert their own friend connections
CREATE POLICY "Users can insert their own friend connections" 
ON public.friends FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own friend connections
CREATE POLICY "Users can update their own friend connections" 
ON public.friends FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy to allow users to delete their own friend connections
CREATE POLICY "Users can delete their own friend connections" 
ON public.friends FOR DELETE 
USING (auth.uid() = user_id);

-- Add RLS policies for social_comments
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select comments on public shares or their own shares
CREATE POLICY "Users can view comments on public shares or their own shares" 
ON public.social_comments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.social_shares 
        WHERE social_shares.id = share_id 
        AND (social_shares.is_public OR social_shares.user_id = auth.uid())
    )
);

-- Policy to allow users to insert their own comments
CREATE POLICY "Users can insert their own comments" 
ON public.social_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.social_comments FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.social_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Add RLS policies for social_likes
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select likes on public shares or their own shares
CREATE POLICY "Users can view likes on public shares or their own shares" 
ON public.social_likes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.social_shares 
        WHERE social_shares.id = share_id 
        AND (social_shares.is_public OR social_shares.user_id = auth.uid())
    )
);

-- Policy to allow users to insert their own likes
CREATE POLICY "Users can insert their own likes" 
ON public.social_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own likes
CREATE POLICY "Users can delete their own likes" 
ON public.social_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS social_shares_user_id_idx ON public.social_shares(user_id);
CREATE INDEX IF NOT EXISTS social_shares_habit_id_idx ON public.social_shares(habit_id);
CREATE INDEX IF NOT EXISTS social_shares_public_idx ON public.social_shares(is_public);
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS friends_status_idx ON public.friends(status);
CREATE INDEX IF NOT EXISTS social_comments_share_id_idx ON public.social_comments(share_id);
CREATE INDEX IF NOT EXISTS social_comments_user_id_idx ON public.social_comments(user_id);
CREATE INDEX IF NOT EXISTS social_likes_share_id_idx ON public.social_likes(share_id);
CREATE INDEX IF NOT EXISTS social_likes_user_id_idx ON public.social_likes(user_id);
