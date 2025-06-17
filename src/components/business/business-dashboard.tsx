// src/components/business/business-owner-overview.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { businessService, type Business, type BusinessOwnerStats } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  stats: BusinessOwnerStats
  recentBusinesses: Business[]
}

export default function BusinessOwnerOverview() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    stats: { totalBusinesses: 0, publishedBusinesses: 0, pendingBusinesses: 0, totalReviews: 0, averageRating: 0 },
    recentBusinesses: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch business owner dashboard data
  const fetchDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Get stats and recent businesses for this owner
      const [statsResult, businessesResult] = await Promise.all([
        businessService.getOwnerStats(user.id),
        businessService.getBusinesses({ ownerId: user.id, limit: 3 })
      ])

      // Check for errors
      if (statsResult.error) {
        throw new Error('Failed to load business statistics')
      }
      if (businessesResult.error) {
        throw new Error('Failed to load your businesses')
      }

      setData({
        stats: statsResult.data || { totalBusinesses: 0, publishedBusinesses: 0, pendingBusinesses: 0, totalReviews: 0, averageRating: 0 },
        recentBusinesses: businessesResult.data || []
      })

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
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
          <Button onClick={fetchDashboardData} variant="outline">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
        <p className="text-gray-600">Manage your business listings and track performance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Businesses"
          value={data.stats.totalBusinesses}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatsCard
          title="Published"
          value={data.stats.publishedBusinesses}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-green-50"
          iconColor="text-green-600"
          clickable
          onClick={() => router.push('/dashboard/business/my-listings?status=published')}
        />

        <StatsCard
          title="Pending Review"
          value={data.stats.pendingBusinesses}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          clickable
          onClick={() => router.push('/dashboard/business/my-listings?status=pending')}
        />

        <StatsCard
          title="Customer Reviews"
          value={data.stats.totalReviews}
          subtitle={data.stats.averageRating > 0 ? `${data.stats.averageRating}★ avg` : 'No reviews yet'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
              onClick={() => router.push('/dashboard/business/my-listings')}
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
                  <div className="font-medium">Manage Listings</div>
                  <div className="text-sm text-gray-600">Edit and update your businesses</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/add-business')}
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Add Business</div>
                  <div className="text-sm text-gray-600">List a new business</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Your businesses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Businesses</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/business/my-listings')}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentBusinesses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mb-4">You haven't added any businesses yet</p>
              <Button onClick={() => router.push('/add-business')}>
                Add Your First Business
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentBusinesses.map(business => (
                <BusinessCard key={business.id} business={business} />
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
  subtitle?: string
  icon: React.ReactNode
  bgColor: string
  iconColor: string
  clickable?: boolean
  onClick?: () => void
}

function StatsCard({ title, value, subtitle, icon, bgColor, iconColor, clickable, onClick }: StatsCardProps) {
  if (clickable) {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <button onClick={onClick} className="w-full text-left">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
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
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
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

// Business card component for dashboard
interface BusinessCardProps {
  business: Business
}

function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'suspended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting admin approval'
      case 'published': return 'Live and visible to customers'
      case 'rejected': return 'Review required - please contact support'
      case 'suspended': return 'Temporarily suspended'
      default: return ''
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium text-gray-900">{business.name}</h3>
          <Badge className={getStatusColor(business.status)}>
            {business.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-1">{business.address}</p>
        <p className="text-xs text-gray-500">{getStatusMessage(business.status)}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/business/edit/${business.id}`)}
        >
          Edit
        </Button>
        {business.status === 'published' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/business/${business.slug}`)}
          >
            View
          </Button>
        )}
      </div>
    </div>
  )
}