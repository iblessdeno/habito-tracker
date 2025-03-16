import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// POST endpoint to snooze a reminder
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // In API routes, we don't need to set cookies as they're handled by Supabase client
          },
          remove(name: string, options: any) {
            // In API routes, we don't need to remove cookies as they're handled by Supabase client
          },
        },
      }
    );
    
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { habitId, snoozeMinutes = 15 } = await request.json();
    
    if (!habitId) {
      return NextResponse.json({ error: 'Missing habit ID' }, { status: 400 });
    }
    
    // Get the habit and its reminder
    const { data: habit, error: habitError } = await supabaseServer
      .from('habits')
      .select('id, title')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();
    
    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }
    
    // Schedule a new notification after the snooze period
    // In a real implementation, this would interact with a notification service
    // For now, we'll just return success
    
    return NextResponse.json({ 
      success: true, 
      message: `Reminder for "${habit.title}" snoozed for ${snoozeMinutes} minutes` 
    });
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    return NextResponse.json({ error: 'Failed to snooze reminder' }, { status: 500 });
  }
}
