"use client"

import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import Sidebar from "@/components/layout/sidebar"

interface AchievementsLayoutProps {
  children: ReactNode
}

export default function AchievementsLayout({ children }: AchievementsLayoutProps) {
  return (
    <AuthProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
