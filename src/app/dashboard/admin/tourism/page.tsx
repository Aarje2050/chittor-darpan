// src/app/dashboard/admin/tourism/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { tourismService } from '@/lib/database'
import { type TourismPlace, type TourismCounts } from '@/types/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TourismFilters {
  status: 'all' | 'draft' | 'published' | 'rejected'
  search: string
}

export default function AdminTourismManagementPage() {
  const [tourismPlaces, setTourismPlaces] = useState<TourismPlace[]>([])
  const [counts, setCounts] = useState<TourismCounts>({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0
  })
  const [filters, setFilters] = useState<TourismFilters>({
    status: 'all',
    search: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadTourismData()
  }, [filters])

  const loadTourismData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build filters for API call
      const apiFilters: any = {}
      
      if (filters.status !== 'all') {
        apiFilters.status = filters.status
      }
      
      if (filters.search.trim()) {
        apiFilters.search = filters.search.trim()
      }

      // Load tourism places and counts in parallel
      const [placesResult, countsResult] = await Promise.all([
        tourismService.getTourismPlaces(apiFilters),
        tourismService.getTourismCounts()
      ])

      if (placesResult.error) {
        throw new Error('Failed to load tourism places')
      }

      if (countsResult.error) {
        throw new Error('Failed to load counts')
      }

      setTourismPlaces(placesResult.data || [])
      setCounts(countsResult.data || { total: 0, pending: 0, published: 0, rejected: 0 })

    } catch (err) {
      console.error('Error loading tourism data:', err)
      setError('Failed to load tourism places')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (placeId: string, newStatus: 'draft' | 'published' | 'rejected') => {
    try {
      setActionLoading(placeId)
      setError(null)

      const { success, error: updateError } = await tourismService.updateTourismStatus(placeId, newStatus)

      if (!success || updateError) {
        throw new Error('Failed to update status')
      }

      // Refresh data
      await loadTourismData()

    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update tourism place status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (placeId: string, placeName: string) => {
    if (!confirm(`Are you sure you want to delete "${placeName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(placeId)
      setError(null)

      const { success, error: deleteError } = await tourismService.deleteTourismPlace(placeId)

      if (!success || deleteError) {
        throw new Error('Failed to delete tourism place')
      }

      // Refresh data
      await loadTourismData()

    } catch (err) {
      console.error('Error deleting tourism place:', err)
      setError('Failed to delete tourism place')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredAndSortedPlaces = tourismPlaces.sort((a, b) => {
    // Featured places first, then by creation date
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <>
      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Tourism Management"
          showBackButton
          onBackClick={() => router.push('/dashboard/admin')}
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileTourismManagement
            tourismPlaces={filteredAndSortedPlaces}
            counts={counts}
            filters={filters}
            loading={loading}
            error={error}
            actionLoading={actionLoading}
            onFiltersChange={setFilters}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onAddNew={() => router.push('/dashboard/admin/tourism/add')}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <DesktopTourismManagement
            tourismPlaces={filteredAndSortedPlaces}
            counts={counts}
            filters={filters}
            loading={loading}
            error={error}
            actionLoading={actionLoading}
            onFiltersChange={setFilters}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onAddNew={() => router.push('/dashboard/admin/tourism/add')}
            onGoBack={() => router.push('/dashboard/admin')}
          />
        </div>
      </div>
    </>
  )
}

// Mobile Component
interface TourismManagementProps {
  tourismPlaces: TourismPlace[]
  counts: TourismCounts
  filters: TourismFilters
  loading: boolean
  error: string | null
  actionLoading: string | null
  onFiltersChange: (filters: TourismFilters) => void
  onStatusChange: (id: string, status: 'draft' | 'published' | 'rejected') => void
  onDelete: (id: string, name: string) => void
  onAddNew: () => void
}

function MobileTourismManagement({
  tourismPlaces,
  counts,
  filters,
  loading,
  error,
  actionLoading,
  onFiltersChange,
  onStatusChange,
  onDelete,
  onAddNew
}: TourismManagementProps) {
  return (
    <>
      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tourism Overview</CardTitle>
            <Button onClick={onAddNew} size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Place
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
              <div className="text-xs text-blue-700">Total Places</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{counts.published}</div>
              <div className="text-xs text-green-700">Published</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
              <div className="text-xs text-yellow-700">Draft</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
              <div className="text-xs text-red-700">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Status ({counts.total})</option>
              <option value="draft">Draft ({counts.pending})</option>
              <option value="published">Published ({counts.published})</option>
              <option value="rejected">Rejected ({counts.rejected})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search tourism places..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tourism Places List */}
      {loading ? (
        <TourismPlacesSkeleton />
      ) : tourismPlaces.length > 0 ? (
        <div className="space-y-4">
          {tourismPlaces.map(place => (
            <TourismPlaceCard
              key={place.id}
              place={place}
              actionLoading={actionLoading === place.id}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <TourismPlacesEmptyState 
          filters={filters} 
          onAddNew={onAddNew}
          onClearFilters={() => onFiltersChange({ status: 'all', search: '' })} 
        />
      )}
    </>
  )
}

// Desktop Component
interface DesktopTourismManagementProps extends TourismManagementProps {
  onGoBack: () => void
}

function DesktopTourismManagement({
  tourismPlaces,
  counts,
  filters,
  loading,
  error,
  actionLoading,
  onFiltersChange,
  onStatusChange,
  onDelete,
  onAddNew,
  onGoBack
}: DesktopTourismManagementProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex items-center gap-2 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admin Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tourism Management</h1>
            <p className="text-gray-600 mt-2">Manage tourism places and their content</p>
          </div>
          <Button onClick={onAddNew} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Place
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Stats & Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{counts.total}</div>
                <div className="text-sm text-blue-700">Total Places</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{counts.published}</div>
                <div className="text-sm text-green-700">Published</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{counts.pending}</div>
                <div className="text-sm text-yellow-700">Draft</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{counts.rejected}</div>
                <div className="text-sm text-red-700">Rejected</div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Status ({counts.total})</option>
                  <option value="draft">Draft ({counts.pending})</option>
                  <option value="published">Published ({counts.published})</option>
                  <option value="rejected">Rejected ({counts.rejected})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  placeholder="Search tourism places..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => onFiltersChange({ status: 'all', search: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tourism Places */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <TourismPlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : tourismPlaces.length > 0 ? (
            <div className="space-y-4">
              {tourismPlaces.map(place => (
                <TourismPlaceCard
                  key={place.id}
                  place={place}
                  actionLoading={actionLoading === place.id}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <TourismPlacesEmptyState 
              filters={filters} 
              onAddNew={onAddNew}
              onClearFilters={() => onFiltersChange({ status: 'all', search: '' })} 
            />
          )}
        </div>
      </div>
    </>
  )
}

// Tourism Place Card Component
function TourismPlaceCard({ 
  place, 
  actionLoading, 
  onStatusChange, 
  onDelete 
}: {
  place: TourismPlace
  actionLoading: boolean
  onStatusChange: (id: string, status: 'draft' | 'published' | 'rejected') => void
  onDelete: (id: string, name: string) => void
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start gap-4">
          {/* Place Icon */}
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg lg:text-xl">🏛️</span>
          </div>
          
          {/* Place Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-base lg:text-lg truncate">
                {place.name}
              </h3>
              <div className="flex gap-1 flex-shrink-0">
                {place.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                )}
                {getStatusBadge(place.status)}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">
                {place.area_name ? `${place.area_name}, ` : ''}{place.city_name}
              </span>
            </div>
            
            {/* Category */}
            {place.category_name && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="truncate">{place.category_name}</span>
              </div>
            )}
            
            {/* Short Description */}
            {place.short_description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {place.short_description}
              </p>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {actionLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <>
                  {/* Status Change Buttons */}
                  {place.status !== 'published' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(place.id, 'published')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Publish
                    </Button>
                  )}
                  
                  {place.status !== 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(place.id, 'draft')}
                    >
                      Draft
                    </Button>
                  )}
                  
                  {place.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(place.id, 'rejected')}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  )}
                  
                  {/* View Link */}
                  {place.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/tourism/${place.slug}`, '_blank')}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Button>
                  )}
                  
                  {/* Images Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/dashboard/admin/tourism/${place.id}/images`}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Images
                  </Button>
                  
                  {/* Delete Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(place.id, place.name)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </>
              )}
            </div>
            
            {/* Created Date */}
            <div className="text-xs text-gray-500 mt-3">
              Created: {new Date(place.created_at).toLocaleDateString()}
              {place.creator_name && ` by ${place.creator_name}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
function TourismPlacesEmptyState({ 
  filters, 
  onAddNew, 
  onClearFilters 
}: {
  filters: TourismFilters
  onAddNew: () => void
  onClearFilters: () => void
}) {
  const hasActiveFilters = filters.status !== 'all' || filters.search.trim()

  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">
          {hasActiveFilters ? 'No tourism places found' : 'No tourism places yet'}
        </h3>
        
        {hasActiveFilters ? (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              No places match your current filters. Try adjusting your search criteria.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onClearFilters} variant="outline">
                Clear Filters
              </Button>
              <Button onClick={onAddNew}>
                Add New Place
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              Start building your tourism directory by adding your first place.
            </p>
            <Button onClick={onAddNew} className="lg:text-base lg:px-6 lg:py-3">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Tourism Place
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function TourismPlacesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <TourismPlaceCardSkeleton key={i} />
      ))}
    </div>
  )
}

function TourismPlaceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 lg:h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}