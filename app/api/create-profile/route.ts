import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { id, name, username, email } = await request.json();

    console.log('Creating profile for:', { id, name, username, email });

    if (!id || !name || !username || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    try {
      const supabase = getSupabaseAdmin();
      
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        console.log('Error checking for existing profile:', checkError);
      }

      if (existingProfile) {
        return NextResponse.json(
          { message: 'Profile already exists' },
          { status: 200 }
        );
      }

      // Create profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id,
          name,
          username,
          email,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile in Supabase:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Profile created successfully', profile: data },
        { status: 201 }
      );
    } catch (supabaseError) {
      console.error('Supabase admin client error:', supabaseError);
      return NextResponse.json(
        { error: 'Database connection error', details: supabaseError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in create-profile route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
