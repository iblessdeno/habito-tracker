import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign up a new user and create their profile
  const signUp = async (
    email: string,
    password: string,
    name: string,
    username: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create the user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            username,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      // Step 2: Create the user profile
      if (data.user) {
        try {
          // First attempt: Try to create profile directly
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name,
              username,
              email,
            });

          if (profileError) {
            console.warn('Direct profile creation failed:', profileError);
            // The trigger should handle this automatically, so we can continue
          }

          return { 
            success: true, 
            user: data.user,
            message: 'Account created successfully! Please check your email to verify your account.'
          };
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail the signup, as the trigger should handle profile creation
          return { 
            success: true, 
            user: data.user,
            message: 'Account created successfully! Please check your email to verify your account.'
          };
        }
      }

      return { 
        success: true, 
        message: 'Account created successfully! Please check your email to verify your account.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out the current user
  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        return { success: false, error: signOutError.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    isLoading,
    error,
  };
}
