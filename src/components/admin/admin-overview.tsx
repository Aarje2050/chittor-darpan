// src/components/admin/admin-overview.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { businessService, userService, type BusinessCounts, type Business } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  businessCounts: BusinessCounts
  totalUsers: number
  recentBusinesses: Business[]
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    businessCounts: { total: 0, pending: 0, published: 0, rejected: 0, suspended: 0 },
    totalUsers: 0,
    recentBusinesses: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch dashboard stats using database service - SUPER CLEAN! 🚀
  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use database service for clean, parallel requests
      const [businessCountsResult, userCountResult, recentBusinessesResult] = await Promise.all([
        businessService.getCounts(),
        userService.getCount(), 
        businessService.getRecent(5)
      ])

      // Check for errors
      if (businessCountsResult.error) {
        throw new Error('Failed to load business counts')
      }
      if (userCountResult.error) {
        throw new Error('Failed to load user count')
      }
      if (recentBusinessesResult.error) {
        throw new Error('Failed to load recent businesses')
      }

      setStats({
        businessCounts: businessCountsResult.data || { total: 0, pending: 0, published: 0, rejected: 0, suspended: 0 },
        totalUsers: userCountResult.data || 0,
        recentBusinesses: recentBusinessesResult.data || []
      })

    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to load dashboard</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchDashboardStats} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your business directory platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Businesses"
          value={stats.businessCounts.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatsCard
          title="Pending Approval"
          value={stats.businessCounts.pending}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          clickable
          onClick={() => router.push('/dashboard/admin/listings?status=pending')}
        />

        <StatsCard
          title="Published"
          value={stats.businessCounts.published}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-green-50"
          iconColor="text-green-600"
          clickable
          onClick={() => router.push('/dashboard/admin/listings?status=published')}
        />

        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => router.push('/dashboard/admin/listings')}
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Manage Businesses</div>
                  <div className="text-sm text-gray-600">View and approve listings</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/dashboard/admin/listings?status=pending')}
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Review Pending</div>
                  <div className="text-sm text-gray-600">{stats.businessCounts.pending} awaiting approval</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent businesses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Business Submissions</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/admin/listings')}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentBusinesses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p>No recent business submissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentBusinesses.map(business => (
                <div 
                  key={business.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{business.name}</div>
                    <div className="text-sm text-gray-600">by {business.owner_email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      business.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : business.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {business.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(business.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable stats card component
interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  bgColor: string
  iconColor: string
  clickable?: boolean
  onClick?: () => void
}

function StatsCard({ title, value, icon, bgColor, iconColor, clickable, onClick }: StatsCardProps) {
  if (clickable) {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <button onClick={onClick} className="w-full text-left">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${bgColor}`}>
                <div className={iconColor}>
                  {icon}
                </div>
              </div>
            </div>
          </CardContent>
        </button>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}