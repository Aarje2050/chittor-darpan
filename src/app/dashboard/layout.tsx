// src/app/dashboard/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { userService } from '@/lib/database'
import DashboardLayout from '@/components/admin/dashboard-layout'

// Define route permissions
const ROUTE_PERMISSIONS = {
  '/dashboard/admin': ['admin'],
  '/dashboard/admin/listings': ['admin'],
  '/dashboard/business': ['business_owner', 'admin'],
  '/dashboard/business/edit': ['business_owner', 'admin'],
  '/dashboard/business/my-listings': ['business_owner', 'admin']
} as const

// Loading component
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}

// Access denied component
function AccessDenied({ userRole }: { userRole: string }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this dashboard.
            {userRole === 'user' && ' Please contact admin to upgrade your account.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
            
            {userRole === 'user' && (
              <button
                onClick={() => router.push('/add-business')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Your Business
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Get user role when user is available
  useEffect(() => {
    if (user && !userRole) {
      const fetchUserRole = async () => {
        try {
          const { data: role } = await userService.getCurrentUserRole(user.id)
          setUserRole(role || 'user')
        } catch (error) {
          console.error('Error fetching user role:', error)
          setUserRole('user') // Default to user if error
        } finally {
          setRoleLoading(false)
        }
      }

      fetchUserRole()
    }
  }, [user, userRole])

  // Check route permissions
  useEffect(() => {
    if (userRole && pathname) {
      // Find matching route permission
      const routeKey = Object.keys(ROUTE_PERMISSIONS).find(route => 
        pathname.startsWith(route)
      ) as keyof typeof ROUTE_PERMISSIONS

      if (routeKey) {
        const allowedRoles = ROUTE_PERMISSIONS[routeKey]
        setHasAccess(allowedRoles.includes(userRole as any))
      } else {
        // Default to no access for unknown dashboard routes
        setHasAccess(false)
      }
    }
  }, [userRole, pathname])

  // Show loading while checking auth or role
  if (authLoading || roleLoading) {
    return <DashboardLoading />
  }

  // Redirect to login if no user (this should be caught by first useEffect)
  if (!user) {
    return <DashboardLoading />
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess && userRole) {
    return <AccessDenied userRole={userRole} />
  }

  // Show protected dashboard content
  return <DashboardLayout>{children}</DashboardLayout>
}