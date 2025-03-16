'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { VariantProps } from 'class-variance-authority';

interface SignOutButtonProps extends React.ComponentProps<"button">, 
  VariantProps<typeof buttonVariants> {
  showIcon?: boolean;
  asChild?: boolean;
}

export function SignOutButton({ 
  className, 
  variant = 'default', 
  size = 'default',
  showIcon = false,
  children, 
  ...props 
}: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleSignOut}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full mr-2"></div>
      ) : showIcon && (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      {children || 'Sign Out'}
    </Button>
  );
}
