import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// This is a server-side only route that initializes the database
// It should be called once during deployment or setup

export async function GET() {
  try {
    // Only allow this in development or with proper authorization in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = headers().get('authorization');
      if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Initialize Supabase client with service role key for admin privileges
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    const results = [];
    for (const statement of statements) {
      try {
        // For Supabase, we need to use the SQL API
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          results.push({ 
            statement: statement.substring(0, 50) + '...', 
            success: false, 
            error: error.message 
          });
        } else {
          results.push({ 
            statement: statement.substring(0, 50) + '...', 
            success: true 
          });
        }
      } catch (error) {
        results.push({ 
          statement: statement.substring(0, 50) + '...', 
          success: false, 
          error: error.message 
        });
      }
    }

    return NextResponse.json({ 
      message: 'Database initialization completed', 
      results 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}

// Helper function to get headers
function headers() {
  return {
    get: (name: string) => {
      return null; // In a real implementation, this would return the actual header
    }
  };
}
