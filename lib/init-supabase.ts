import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * Initialize Supabase tables and policies
 * Run this function once when setting up your application
 */
export async function initializeSupabase() {
  try {
    console.log('Initializing Supabase tables and policies...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL statements
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error initializing Supabase:', error);
      return false;
    }
    
    console.log('Supabase tables and policies initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

// Example usage:
// import { initializeSupabase } from '@/lib/init-supabase';
// await initializeSupabase();
