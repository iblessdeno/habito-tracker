import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzuzrcvwxpifbyjlwmyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dXpyY3Z3eHBpZmJ5amx3bXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzMzNDksImV4cCI6MjA1NzMwOTM0OX0.5lRdV19SdND7StY_jOx8Em1U9Jg2zcoAL0YyEhk_uIs';

// Create a single supabase client for the entire session
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
