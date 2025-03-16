import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  // Get the supabase URL and key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Create a new supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get the cookie store - this is the line that needs to be awaited in Next.js 14
    const cookieStore = await cookies();
    
    // Extract project reference from URL to use in cookie name
    const projectRef = supabaseUrl.match(/(?:\/\/|^)([a-z0-9-]+)\.supabase\.co/)?.[1] || '';
    
    // Get the auth cookie using the dynamic project reference
    const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`);
    
    if (authCookie) {
      const cookieValue = JSON.parse(authCookie.value);
      
      // Set the auth cookie for the supabase client
      supabase.auth.setSession({
        access_token: cookieValue.access_token,
        refresh_token: cookieValue.refresh_token,
      });
    }
  } catch (error) {
    console.error('Error setting supabase cookie:', error);
  }
  
  return supabase;
}
