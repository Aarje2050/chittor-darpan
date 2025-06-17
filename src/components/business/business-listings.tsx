// src/components/business/business-owner-listings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { businessService, type Business, type BusinessFilters } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type StatusFilter = 'all' | 'pending' | 'published' | 'rejected' | 'suspended'

export default function BusinessOwnerListings() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Get initial filter from URL params
  useEffect(() => {
    const urlStatus = searchParams.get('status') as StatusFilter
    if (urlStatus && ['all', 'pending', 'published', 'rejected', 'suspended'].includes(urlStatus)) {
      setStatusFilter(urlStatus)
    }

    // Check for success message
    const successType = searchParams.get('success')
    if (successType === 'created') {
      setShowSuccess(true)
      // Clear the success param from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('success')
      window.history.replaceState({}, '', newUrl.toString())
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  // Fetch user's businesses using database service
  const fetchBusinesses = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const filters: BusinessFilters = {
        ownerId: user.id, // Only get businesses owned by current user
        status: statusFilter,
        search: searchQuery.trim()
      }

      const { data, error: fetchError } = await businessService.getBusinesses(filters)

      if (fetchError) {
        throw new Error('Failed to load your businesses')
      }

      setBusinesses(data || [])
    } catch (err) {
      console.error('Error fetching businesses:', err)
      setError('Failed to load your businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when filters change or user changes
  useEffect(() => {
    if (user?.id) {
      fetchBusinesses()
    }
  }, [statusFilter, searchQuery, user?.id])

  // Status filter configuration
  const statusFilters: { key: StatusFilter; label: string; description: string }[] = [
    { key: 'all', label: 'All', description: 'All your businesses' },
    { key: 'published', label: 'Live', description: 'Visible to customers' },
    { key: 'pending', label: 'Pending', description: 'Awaiting approval' },
    { key: 'rejected', label: 'Rejected', description: 'Need attention' },
    { key: 'suspended', label: 'Suspended', description: 'Temporarily hidden' }
  ]

  if (loading && businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your businesses...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-green-800 font-medium">Business listing created successfully!</p>
                <p className="text-green-700 text-sm">Your business is now pending review and will be live within 1-2 business days.</p>
              </div>
              <Button 
                onClick={() => setShowSuccess(false)}
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Business Listings</h1>
          <p className="text-gray-600">Manage and update your business information</p>
        </div>
        <Button 
          onClick={() => router.push('/add-business')}
          className="bg-black text-white hover:bg-gray-800"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Business
        </Button>
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search your businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusFilters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${
                  statusFilter === filter.key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Filter description */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {statusFilters.find(f => f.key === statusFilter)?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchBusinesses}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business list */}
      <div className="space-y-4">
        {businesses.length === 0 && !loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery 
                  ? `No businesses match "${searchQuery}"`
                  : statusFilter === 'all' 
                    ? 'No businesses found'
                    : `No ${statusFilter} businesses found`
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {businesses.length === 0 && statusFilter === 'all' 
                  ? "You haven't added any businesses yet. Get started by adding your first business listing."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {businesses.length === 0 && statusFilter === 'all' && (
                <Button onClick={() => router.push('/add-business')}>
                  Add Your First Business
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          businesses.map(business => (
            <BusinessOwnerCard 
              key={business.id} 
              business={business}
              onRefresh={fetchBusinesses}
            />
          ))
        )}
      </div>

      {/* Loading indicator */}
      {loading && businesses.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
        </div>
      )}
    </div>
  )
}

// Individual business card for business owners
interface BusinessOwnerCardProps {
  business: Business
  onRefresh: () => void
}

function BusinessOwnerCard({ business, onRefresh }: BusinessOwnerCardProps) {
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
      case 'pending': return 'Your business is being reviewed by our team. This usually takes 1-2 business days.'
      case 'published': return 'Your business is live and visible to customers searching in your area.'
      case 'rejected': return 'Your listing needs attention. Please contact support for guidance on resubmission.'
      case 'suspended': return 'Your business listing is temporarily suspended. Contact support for more information.'
      default: return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{business.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{business.city_name || 'Unknown City'}</span>
              {business.area_name && (
                <>
                  <span>•</span>
                  <span>{business.area_name}</span>
                </>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(business.status)}>
            {business.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Business details */}
        <div>
          <p className="text-sm text-gray-600 mb-2">{business.description || 'No description provided'}</p>
          <p className="text-sm text-gray-500">{business.address}</p>
        </div>

        {/* Status explanation */}
        <div className={`p-3 rounded-lg border ${
          business.status === 'published' ? 'bg-green-50 border-green-200' :
          business.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          business.status === 'rejected' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <p className="text-sm text-gray-700">{getStatusMessage(business.status)}</p>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {business.phone && business.phone.length > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{business.phone[0]}</span>
            </div>
          )}
          
          {business.email && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="break-all">{business.email}</span>
            </div>
          )}

          {business.website && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
              </svg>
              <span className="break-all">{business.website}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {(business.is_featured || business.is_verified) && (
          <div className="flex flex-wrap gap-2">
            {business.is_featured && (
              <Badge className="bg-purple-100 text-purple-800">
                Featured
              </Badge>
            )}
            {business.is_verified && (
              <Badge className="bg-blue-100 text-blue-800">
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {formatDate(business.created_at)}</span>
          <span>Updated: {formatDate(business.updated_at)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => router.push(`/dashboard/business/edit/${business.id}`)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Details
          </Button>

          {business.status === 'published' && (
            <Button
              onClick={() => router.push(`/business/${business.slug}`)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Live
            </Button>
          )}

          {business.status === 'rejected' && (
            <Button
              onClick={() => router.push(`/dashboard/business/edit/${business.id}?resubmit=true`)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resubmit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}