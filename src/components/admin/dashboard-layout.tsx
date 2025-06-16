// src/app/dashboard/layout.tsx
'use client'

import { useEffect,useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card } from '@/components/ui/card'
import { userService } from '@/lib/database'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('user')


  useEffect(() => {
    if (user?.id) {
      getUserRole(user.id)
    }
  }, [user?.id])
  
  const getUserRole = async (userId: string) => {
    const { data } = await userService.getCurrentUserRole(userId)
    setUserRole(data || 'user')
  }

  

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first header with profile button */}
      <div className="relative">
        <MobileHeader 
          title="Dashboard" 
          showBackButton={false}
        />
        
        {/* Profile button positioned on the right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="px-4 py-4 border-b bg-white">
        <DashboardNavigation />
      </div>

      {/* Main content */}
      <div className="px-4 py-6">
        {children}
      </div>
    </div>
  )
}

// Mobile-first dashboard navigation
function DashboardNavigation() {
  const { user } = useAuth()
  const router = useRouter()

  // Note: We'll get user role from profile later
  // For now, assuming admin access for testing
  const userRole = 'admin' // TODO: Get from user profile

  const adminNavItems = [
    {
      label: 'Overview',
      href: '/dashboard/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'Business Listings',
      href: '/dashboard/admin/listings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  const businessNavItems = [
    {
      label: 'My Dashboard',
      href: '/dashboard/business',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'My Listings',
      href: '/dashboard/business/my-listings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  const navItems = userRole === 'admin' ? adminNavItems : businessNavItems
  

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {navItems.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}