import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  // Get the supabase URL and key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzuzrcvwxpifbyjlwmyz.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dXpyY3Z3eHBpZmJ5amx3bXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzMzNDksImV4cCI6MjA1NzMwOTM0OX0.5lRdV19SdND7StY_jOx8Em1U9Jg2zcoAL0YyEhk_uIs';

  // Create a new supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get the cookie store - this is the line that needs to be awaited in Next.js 14
    const cookieStore = await cookies();
    
    // Get the auth cookie
    const authCookie = cookieStore.get('sb-tzuzrcvwxpifbyjlwmyz-auth-token');
    
    if (authCookie) {
      const cookieValue = JSON.parse(authCookie.value);
      
      // Set the session manually
      await supabase.auth.setSession({
        access_token: cookieValue.access_token,
        refresh_token: cookieValue.refresh_token,
      });
    }
  } catch (error) {
    console.error('Error setting Supabase session:', error);
  }
  
  return supabase;
}
