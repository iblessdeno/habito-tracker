'use client';

import SidebarComponent from '@/components/layout/sidebar';
import { redirect, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, Suspense, lazy } from 'react';
import { Home, PlusCircle, Calendar, BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';
import { AchievementTracker } from '@/components/achievement/achievement-tracker';

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// This is a Client Component that will be pre-rendered on the server
// but hydrated on the client, which avoids the cookies() issue
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState('/dashboard');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          router.replace('/auth/login');
        } else {
          setUserId(data.session.user.id);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.replace('/auth/login');
      }
    };

    checkAuth();
    setActiveRoute(window.location.pathname);
  }, [router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarComponent />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Add AchievementTracker to initialize achievements for all users */}
        {userId && <AchievementTracker userId={userId} />}
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
      
      {/* Mobile Navigation Bar */}
      <div className="mobile-nav">
        <Link href="/dashboard" className={`mobile-nav-item ${activeRoute === '/dashboard' ? 'active' : ''}`}>
          <Home size={24} className="mobile-nav-item-icon" />
          <span className="mobile-nav-item-label">Home</span>
        </Link>
        <Link href="/dashboard/new-habit" className={`mobile-nav-item ${activeRoute === '/dashboard/new-habit' ? 'active' : ''}`}>
          <PlusCircle size={24} className="mobile-nav-item-icon" />
          <span className="mobile-nav-item-label">New</span>
        </Link>
        <Link href="/dashboard/calendar" className={`mobile-nav-item ${activeRoute === '/dashboard/calendar' ? 'active' : ''}`}>
          <Calendar size={24} className="mobile-nav-item-icon" />
          <span className="mobile-nav-item-label">Calendar</span>
        </Link>
        <Link href="/dashboard/stats" className={`mobile-nav-item ${activeRoute === '/dashboard/stats' ? 'active' : ''}`}>
          <BarChart2 size={24} className="mobile-nav-item-icon" />
          <span className="mobile-nav-item-label">Stats</span>
        </Link>
        <Link href="/dashboard/settings" className={`mobile-nav-item ${activeRoute === '/dashboard/settings' ? 'active' : ''}`}>
          <Settings size={24} className="mobile-nav-item-icon" />
          <span className="mobile-nav-item-label">Settings</span>
        </Link>
      </div>
    </div>
  );
}
