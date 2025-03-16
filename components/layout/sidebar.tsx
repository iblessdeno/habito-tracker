'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Home, 
  PlusCircle, 
  Calendar, 
  BarChart2, 
  Settings, 
  Menu, 
  X,
  Award,
  Share2,
  Bell,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = memo(({ name, href, icon: Icon, isActive, isCollapsed }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-primary/10 text-primary hover:bg-primary/20" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      prefetch={true}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span>{name}</span>}
    </Link>
  );
});
NavItem.displayName = 'NavItem';

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'New Habit',
      href: '/dashboard/new-habit',
      icon: PlusCircle,
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
    },
    {
      name: 'Statistics',
      href: '/dashboard/stats',
      icon: BarChart2,
    },
    {
      name: 'Progress',
      href: '/dashboard/progress',
      icon: TrendingUp,
    },
    {
      name: 'Social',
      href: '/social',
      icon: Share2,
    },
    {
      name: 'Achievements',
      href: '/achievements',
      icon: Award,
    },
    {
      name: 'Reminders',
      href: '/dashboard/reminders',
      icon: Bell,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <div
      className={cn(
        'hidden md:flex flex-col h-screen bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-xl font-bold">
            Habito
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <NavItem 
                  name={item.name} 
                  href={item.href} 
                  icon={item.icon} 
                  isActive={isActive} 
                  isCollapsed={isCollapsed} 
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("p-4 border-t", isCollapsed ? "flex justify-center" : "")}>
        <div className={cn("flex items-center justify-between w-full", isCollapsed ? "flex-col gap-3" : "")}>
          <ThemeToggle />
          <SignOutButton 
            variant="outline" 
            className={cn(
              isCollapsed ? "p-2 w-auto aspect-square" : ""
            )}
          >
            {!isCollapsed && "Sign out"}
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}

// Export a memoized version of the sidebar to prevent unnecessary re-renders
export default memo(Sidebar);
