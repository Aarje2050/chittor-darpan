// src/components/admin/admin-business-listings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { businessService, type Business, type BusinessFilters } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type StatusFilter = 'all' | 'pending' | 'published' | 'rejected' | 'suspended'

export default function AdminBusinessListings() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch businesses using clean database service
  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: BusinessFilters = {
        status: statusFilter,
        search: searchQuery.trim()
      }

      const { data, error: fetchError } = await businessService.getBusinesses(filters)

      if (fetchError) {
        throw new Error('Failed to load businesses')
      }

      setBusinesses(data || [])
    } catch (err) {
      console.error('Error fetching businesses:', err)
      setError('Failed to load businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Update business status using clean database service
  const updateBusinessStatus = async (businessId: string, newStatus: 'published' | 'rejected' | 'suspended') => {
    try {
      setActionLoading(businessId)

      const { success, error } = await businessService.updateStatus(businessId, newStatus)

      if (!success) {
        throw new Error(error?.message || 'Update failed')
      }

      // Update local state
      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId 
            ? { ...business, status: newStatus }
            : business
        )
      )

      console.log(`✅ Business ${newStatus} successfully`)
    } catch (err) {
      console.error('Error updating business:', err)
      alert(`Failed to ${newStatus} business. Please try again.`)
    } finally {
      setActionLoading(null)
    }
  }

  // Auto-fetch when filters change
  useEffect(() => {
    fetchBusinesses()
  }, [statusFilter, searchQuery])

  // Status filter configuration
  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'suspended', label: 'Suspended' }
  ]

  if (loading && businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading businesses...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Listings</h1>
        <p className="text-gray-600">Manage all business submissions and listings</p>
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
              placeholder="Search businesses by name..."
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? `No businesses match "${searchQuery}"`
                  : `No ${statusFilter === 'all' ? '' : statusFilter} businesses found`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          businesses.map(business => (
            <BusinessCard 
              key={business.id} 
              business={business}
              onUpdateStatus={updateBusinessStatus}
              actionLoading={actionLoading === business.id}
            />
          ))
        )}
      </div>

      {/* Loading indicator for actions */}
      {loading && businesses.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
        </div>
      )}
    </div>
  )
}

// Individual business card component
interface BusinessCardProps {
  business: Business
  onUpdateStatus: (id: string, status: 'published' | 'rejected' | 'suspended') => Promise<void>
  actionLoading: boolean
}

function BusinessCard({ business, onUpdateStatus, actionLoading }: BusinessCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'suspended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

        {/* Owner info */}
        {business.owner_email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{business.owner_name || business.owner_email}</span>
          </div>
        )}

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

        {/* Business details */}
        {(business.established_year || business.employee_count) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {business.established_year && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Est. {business.established_year}</span>
              </div>
            )}
            
            {business.employee_count && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{business.employee_count} employees</span>
              </div>
            )}
          </div>
        )}

        {/* Status badges */}
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

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {formatDate(business.created_at)}</span>
          <span>Updated: {formatDate(business.updated_at)}</span>
        </div>

        {/* Action buttons */}
        {business.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onUpdateStatus(business.id, 'published')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              onClick={() => onUpdateStatus(business.id, 'rejected')}
              disabled={actionLoading}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              size="sm"
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        )}

        {business.status === 'published' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onUpdateStatus(business.id, 'suspended')}
              disabled={actionLoading}
              variant="outline"
              className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
              size="sm"
            >
              {actionLoading ? 'Suspending...' : 'Suspend'}
            </Button>
          </div>
        )}

        {business.status === 'rejected' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onUpdateStatus(business.id, 'published')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        )}

        {business.status === 'suspended' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onUpdateStatus(business.id, 'published')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {actionLoading ? 'Reactivating...' : 'Reactivate'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}