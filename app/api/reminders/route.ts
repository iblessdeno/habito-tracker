import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET endpoint to fetch reminders for the current user
export async function GET() {
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
            // This is a read-only API route, so we don't need to set cookies
          },
          remove(name: string, options: any) {
            // This is a read-only API route, so we don't need to remove cookies
          },
        },
      }
    );
    
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: reminders, error } = await supabaseServer
      .from('habit_reminders')
      .select('*, habits(title, color)')
      .eq('user_id', user.id)
      .eq('enabled', true);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST endpoint to create a new reminder
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
    
    const { habitId, time, days } = await request.json();
    
    if (!habitId || !time || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the habit belongs to the user
    const { data: habit, error: habitError } = await supabaseServer
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();
    
    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }
    
    // Create the reminder
    const { data, error } = await supabaseServer
      .from('habit_reminders')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        time,
        days,
        enabled: true
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ reminder: data[0] });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
