// src/app/area/[slug]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { businessService, locationService, type Business, type Area, type City } from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AreaPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function AreaPage({ params }: AreaPageProps) {
  const resolvedParams = use(params)
  const [area, setArea] = useState<Area | null>(null)
  const [city, setCity] = useState<City | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    loadAreaData()
  }, [resolvedParams.slug])

  const loadAreaData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get area and city by slug using enhanced service
      const { data: areaData, error: areaError } = await locationService.getAreaBySlug(resolvedParams.slug)
      
      if (areaError || !areaData) {
        notFound()
        return
      }

      setArea(areaData.area)
      setCity(areaData.city)

      // Load businesses for this area using enhanced service
      const { data: areaBusinesses, error: businessError } = await businessService.getBusinessesByArea(areaData.area.id)

      if (businessError) {
        throw new Error('Failed to load businesses')
      }

      setBusinesses(areaBusinesses || [])

    } catch (err) {
      console.error('Error loading area data:', err)
      setError('Failed to load area data')
    } finally {
      setLoading(false)
    }
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchQuery.trim() || 
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'verified' && business.is_verified) ||
      (categoryFilter === 'featured' && business.is_featured)
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories from businesses
  const availableCategories = [
    { key: 'all', label: 'All Businesses', count: businesses.length },
    { key: 'verified', label: 'Verified', count: businesses.filter(b => b.is_verified).length },
    { key: 'featured', label: 'Featured', count: businesses.filter(b => b.is_featured).length }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Loading..." showBackButton />
        <div className="px-4 py-6">
          <AreaPageSkeleton />
        </div>
      </div>
    )
  }

  if (error || !area || !city) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Area Not Found" showBackButton />
        <div className="px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Area Not Found</h2>
              <p className="text-gray-600 mb-4">
                This area doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        title={area.name}
        showBackButton
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search in ${area.name}...`}
      />
      
      <div className="px-4 py-6 space-y-6">
        {/* Area Header */}
        <AreaHeader area={area} city={city} businessCount={filteredBusinesses.length} />

        {/* Category Filters */}
        <CategoryFilters 
          categories={availableCategories}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredBusinesses.length} results for "{searchQuery}" in {area.name}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <QuickStats businesses={filteredBusinesses} />

        {/* Business Listings */}
        <BusinessListings 
          businesses={filteredBusinesses}
          loading={loading}
          onBusinessClick={(business) => router.push(`/business/${business.slug}`)}
        />

        {/* Empty State */}
        {filteredBusinesses.length === 0 && !loading && (
          <EmptyState 
            area={area}
            hasSearch={!!searchQuery.trim()}
            hasFilter={categoryFilter !== 'all'}
            onClearSearch={() => setSearchQuery('')}
            onClearFilter={() => setCategoryFilter('all')}
          />
        )}

        {/* Area Actions */}
        <AreaActions area={area} city={city} />
      </div>
    </div>
  )
}

// Area Header Component
interface AreaHeaderProps {
  area: Area
  city: City
  businessCount: number
}

function AreaHeader({ area, city, businessCount }: AreaHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Location Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Area Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{area.name}</h1>
            <p className="text-gray-600 mb-3">{city.name}, {city.state}</p>
            
            {area.description && (
              <p className="text-gray-600 mb-3">{area.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>{businessCount} businesses</span>
              <span>•</span>
              <span>Local directory</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Category Filters Component
interface CategoryFiltersProps {
  categories: Array<{ key: string; label: string; count: number }>
  activeFilter: string
  onFilterChange: (filter: string) => void
}

function CategoryFilters({ categories, activeFilter, onFilterChange }: CategoryFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => onFilterChange(category.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${
                activeFilter === category.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
              {category.count > 0 && (
                <span className="ml-1 text-xs opacity-75">({category.count})</span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Stats Component
interface QuickStatsProps {
  businesses: Business[]
}

function QuickStats({ businesses }: QuickStatsProps) {
  const verifiedCount = businesses.filter(b => b.is_verified).length
  const featuredCount = businesses.filter(b => b.is_featured).length
  const recentCount = businesses.filter(b => {
    const daysDiff = Math.ceil((Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 30
  }).length

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-xl font-bold text-gray-900">{businesses.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-xl font-bold text-blue-600">{verifiedCount}</div>
          <div className="text-sm text-gray-600">Verified</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-xl font-bold text-green-600">{recentCount}</div>
          <div className="text-sm text-gray-600">New</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Business Listings Component (reuse from category page)
interface BusinessListingsProps {
  businesses: Business[]
  loading: boolean
  onBusinessClick: (business: Business) => void
}

function BusinessListings({ businesses, loading, onBusinessClick }: BusinessListingsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {businesses.map(business => (
        <BusinessCard 
          key={business.id}
          business={business}
          onClick={() => onBusinessClick(business)}
        />
      ))}
    </div>
  )
}

// Business Card Component (same as category page)
interface BusinessCardProps {
  business: Business
  onClick: () => void
}

function BusinessCard({ business, onClick }: BusinessCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Business Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🏢</span>
          </div>
          
          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{business.name}</h3>
              <div className="flex gap-1 flex-shrink-0">
                {business.is_featured && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs">Featured</Badge>
                )}
                {business.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Description */}
            {business.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {business.description}
              </p>
            )}
            
            {/* Address */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{business.address}</span>
            </div>
            
            {/* Contact Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {business.phone && business.phone.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Call</span>
                </div>
              )}
              {business.whatsapp && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>WhatsApp</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                  <span>Website</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Area Actions Component
interface AreaActionsProps {
  area: Area
  city: City
}

function AreaActions({ area, city }: AreaActionsProps) {
  const handleDirections = () => {
    const query = encodeURIComponent(`${area.name}, ${city.name}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Button
          onClick={handleDirections}
          variant="outline"
          className="w-full justify-start"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Get Directions to {area.name}
        </Button>
        
        <Button
          onClick={() => window.location.href = '/login'}
          variant="outline"
          className="w-full justify-start"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Business in {area.name}
        </Button>
      </CardContent>
    </Card>
  )
}

// Empty State Component
interface EmptyStateProps {
  area: Area
  hasSearch: boolean
  hasFilter: boolean
  onClearSearch: () => void
  onClearFilter: () => void
}

function EmptyState({ area, hasSearch, hasFilter, onClearSearch, onClearFilter }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        
        {hasSearch || hasFilter ? (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              No businesses found matching your criteria in {area.name}.
            </p>
            <div className="space-y-2">
              {hasSearch && (
                <Button onClick={onClearSearch} variant="outline" size="sm">
                  Clear Search
                </Button>
              )}
              {hasFilter && (
                <Button onClick={onClearFilter} variant="outline" size="sm">
                  Show All Businesses
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to add a business in {area.name}!
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Add Your Business
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function AreaPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {Array.from({ length: 4 }).map((_, i) => (
        <BusinessCardSkeleton key={i} />
      ))}
    </div>
  )
}

function BusinessCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}