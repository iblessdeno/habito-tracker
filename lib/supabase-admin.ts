import { createClient } from '@supabase/supabase-js';

// This client uses the service role key and should only be used on the server
// for administrative tasks like creating tables and policies
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or service role key');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Execute SQL statements directly
export async function executeSql(sql: string) {
  const supabase = getSupabaseAdmin();
  
  try {
    // For Supabase, we need to use the SQL API with service role key
    // This requires enabling the pg_execute_sql extension in your project
    const { data, error } = await supabase.rpc('pg_execute_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error };
  }
}
