// src/app/tourism/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { tourismService, categoryService, locationService, type City } from '@/lib/database'
import { type TourismPlace, type TourismCategory } from '@/types/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

interface TourismFilters {
  search: string
  category: string
  city: string
  sortBy: 'newest' | 'name' | 'featured'
}

interface TourismResults {
  places: TourismPlace[]
  totalCount: number
  currentPage: number
  totalPages: number
}

// Main content component that uses useSearchParams
function TourismPageContent() {
  const [results, setResults] = useState<TourismResults>({
    places: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  })
  const [filters, setFilters] = useState<TourismFilters>({
    search: '',
    category: 'all',
    city: 'all',
    sortBy: 'newest'
  })
  const [categories, setCategories] = useState<TourismCategory[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    // Initialize from URL params
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const city = searchParams.get('city') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const sortBy = (searchParams.get('sort') as TourismFilters['sortBy']) || 'newest'

    setFilters({
      search,
      category,
      city,
      sortBy
    })

    loadTourismData(search, category, city, page, sortBy)
  }, [searchParams])

  const loadTourismData = async (
    search: string,
    category: string,
    city: string,
    page: number,
    sortBy: TourismFilters['sortBy']
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Load categories and cities in parallel
      const [categoriesResult, citiesResult] = await Promise.all([
        tourismService.getTourismCategories(),
        locationService.getCities()
      ])

      if (categoriesResult.data) setCategories(categoriesResult.data)
      if (citiesResult.data) setCities(citiesResult.data)

      // Load tourism places
      await loadTourismPlaces(search, category, city, page, sortBy)

    } catch (err) {
      console.error('Error loading tourism data:', err)
      setError('Failed to load tourism places')
    } finally {
      setLoading(false)
    }
  }

  const loadTourismPlaces = async (
    search: string,
    category: string,
    city: string,
    page: number,
    sortBy: TourismFilters['sortBy']
  ) => {
    try {
      // Build filters
      const tourismFilters: any = {
        status: 'published',
        limit: 1000 // Get all, then sort and paginate client-side
      }

      if (search.trim()) {
        tourismFilters.search = search.trim()
      }

      if (category !== 'all') {
        tourismFilters.categorySlug = category
      }

      if (city !== 'all') {
        tourismFilters.city = city
      }

      // Get tourism places
      let { data: places, error: fetchError } = await tourismService.getTourismPlaces(tourismFilters)

      if (fetchError) {
        throw new Error('Failed to load tourism places')
      }

      places = places || []

      // Apply sorting
      places = sortTourismPlaces(places, sortBy)

      // Calculate pagination
      const totalCount = places.length
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedPlaces = places.slice(startIndex, endIndex)

      setResults({
        places: paginatedPlaces,
        totalCount,
        currentPage: page,
        totalPages
      })

    } catch (err) {
      console.error('Error loading tourism places:', err)
      setError('Failed to load tourism places')
    }
  }

  const sortTourismPlaces = (places: TourismPlace[], sortBy: TourismFilters['sortBy']) => {
    switch (sortBy) {
      case 'name':
        return [...places].sort((a, b) => a.name.localeCompare(b.name))
      case 'featured':
        return [...places].sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      case 'newest':
      default:
        return [...places].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
  }

  const updateURL = (newFilters: Partial<TourismFilters>, page: number = 1) => {
    const params = new URLSearchParams()
    
    if (newFilters.search?.trim()) params.set('search', newFilters.search.trim())
    if (newFilters.category && newFilters.category !== 'all') params.set('category', newFilters.category)
    if (newFilters.city && newFilters.city !== 'all') params.set('city', newFilters.city)
    if (newFilters.sortBy && newFilters.sortBy !== 'newest') params.set('sort', newFilters.sortBy)
    if (page > 1) params.set('page', page.toString())

    const newURL = `/tourism${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }

  const handleFilterChange = (newFilters: Partial<TourismFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    updateURL(updatedFilters, 1) // Reset to page 1 when filters change
  }

  const handlePageChange = (page: number) => {
    updateURL(filters, page)
  }

  // SEO metadata
  const getPageTitle = () => {
    if (filters.search) {
      return `Tourism: "${filters.search}" - Chittor Darpan`
    }
    if (filters.category !== 'all') {
      const category = categories.find(c => c.slug === filters.category)
      return `${category?.name || 'Category'} Tourism Places - Chittor Darpan`
    }
    return 'Tourism Places in Chittorgarh - Chittor Darpan'
  }

  const getPageDescription = () => {
    return `Discover ${results.totalCount} amazing tourism places in Chittorgarh. Explore forts, temples, lakes, monuments and more beautiful destinations with detailed information.`
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/tourism${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Tourism Places"
          showBackButton
          showSearch
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange({ search: value })}
          searchPlaceholder="Search tourism places..."
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileTourismContent 
            results={results}
            filters={filters}
            categories={categories}
            cities={cities}
            loading={loading}
            error={error}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onPlaceClick={(place) => router.push(`/tourism/${place.slug}`)}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopTourismLayout
          results={results}
          filters={filters}
          categories={categories}
          cities={cities}
          loading={loading}
          error={error}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onPlaceClick={(place) => router.push(`/tourism/${place.slug}`)}
        />
      </div>
    </>
  )
}

// Main page component with Suspense wrapper
export default function TourismPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tourism places...</p>
        </div>
      </div>
    }>
      <TourismPageContent />
    </Suspense>
  )
}

// Mobile Content Component
interface TourismContentProps {
  results: TourismResults
  filters: TourismFilters
  categories: TourismCategory[]
  cities: City[]
  loading: boolean
  error: string | null
  onFilterChange: (filters: Partial<TourismFilters>) => void
  onPageChange: (page: number) => void
  onPlaceClick: (place: TourismPlace) => void
}

function MobileTourismContent({
  results,
  filters,
  categories,
  cities,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onPlaceClick
}: TourismContentProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tourism Places</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Page Header */}
      <TourismHeader results={results} filters={filters} />

      {/* Filters & Sort */}
      <MobileTourismFilters
        filters={filters}
        categories={categories}
        cities={cities}
        onFilterChange={onFilterChange}
      />

      {/* Results */}
      {loading ? (
        <TourismSkeleton />
      ) : results.places.length > 0 ? (
        <>
          <div className="space-y-4">
            {results.places.map(place => (
              <TourismPlaceCard
                key={place.id}
                place={place}
                onClick={() => onPlaceClick(place)}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {results.totalPages > 1 && (
            <TourismPagination
              currentPage={results.currentPage}
              totalPages={results.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <TourismEmptyState 
          filters={filters} 
          onClearFilters={() => onFilterChange({
            search: '',
            category: 'all',
            city: 'all',
            sortBy: 'newest'
          })} 
        />
      )}
    </>
  )
}

// Desktop Layout Component
function DesktopTourismLayout({
  results,
  filters,
  categories,
  cities,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onPlaceClick
}: TourismContentProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Desktop Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Tourism Places</h1>
          </div>

          {/* Desktop Sort */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as TourismFilters['sortBy'] })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="featured">Featured First</option>
            </select>
          </div>
        </div>

        {/* Desktop Search Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
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
                  placeholder="Search tourism places..."
                  value={filters.search}
                  onChange={(e) => onFilterChange({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="lg:col-span-1">
          <DesktopTourismFilters
            filters={filters}
            categories={categories}
            cities={cities}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* Desktop Results */}
        <div className="lg:col-span-3">
          {error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tourism Places</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <TourismHeader results={results} filters={filters} />
              
              {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TourismPlaceCardSkeleton key={i} />
                  ))}
                </div>
              ) : results.places.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                    {results.places.map(place => (
                      <TourismPlaceCard
                        key={place.id}
                        place={place}
                        onClick={() => onPlaceClick(place)}
                      />
                    ))}
                  </div>
                  
                  {results.totalPages > 1 && (
                    <div className="mt-8">
                      <TourismPagination
                        currentPage={results.currentPage}
                        totalPages={results.totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <TourismEmptyState 
                  filters={filters} 
                  onClearFilters={() => onFilterChange({
                    search: '',
                    category: 'all',
                    city: 'all',
                    sortBy: 'newest'
                  })} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Shared Components

function TourismHeader({ results, filters }: { results: TourismResults; filters: TourismFilters }) {
  const getHeaderText = () => {
    if (filters.search) {
      return `Tourism places matching "${filters.search}"`
    }
    if (filters.category !== 'all') {
      return `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Places`
    }
    return 'All Tourism Places'
  }

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {getHeaderText()}
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              {results.totalCount} places found
              {results.totalPages > 1 && ` • Page ${results.currentPage} of ${results.totalPages}`}
            </p>
          </div>
          <Badge variant="secondary" className="lg:text-sm">
            {results.totalCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function MobileTourismFilters({ filters, categories, cities, onFilterChange }: {
  filters: TourismFilters
  categories: TourismCategory[]
  cities: City[]
  onFilterChange: (filters: Partial<TourismFilters>) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filters & Sort</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as TourismFilters['sortBy'] })}
            className="text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="newest">Newest</option>
            <option value="name">A-Z</option>
            <option value="featured">Featured</option>
          </select>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <select
            value={filters.city}
            onChange={(e) => onFilterChange({ city: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

function DesktopTourismFilters({ filters, categories, cities, onFilterChange }: {
  filters: TourismFilters
  categories: TourismCategory[]
  cities: City[]
  onFilterChange: (filters: Partial<TourismFilters>) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
            <select
              value={filters.city}
              onChange={(e) => onFilterChange({ city: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => onFilterChange({
              category: 'all',
              city: 'all'
            })}
            className="w-full"
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TourismPlaceCard({ place, onClick }: {
  place: TourismPlace
  onClick: () => void
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={onClick}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start gap-4">
          {/* Place Icon */}
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-green-200 group-hover:to-green-300 transition-colors">
            <span className="text-lg lg:text-xl">🏛️</span>
          </div>
          
          {/* Place Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-base lg:text-lg group-hover:text-green-600 transition-colors truncate">
                {place.name}
              </h3>
              <div className="flex gap-1 flex-shrink-0">
                {place.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                )}
                {place.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {place.category_name}
                  </Badge>
                )}
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
            
            {/* Short Description */}
            {place.short_description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {place.short_description}
              </p>
            )}
            
            {/* Tourism Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {place.entry_fee && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>{place.entry_fee}</span>
                </div>
              )}
              {place.duration && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{place.duration}</span>
                </div>
              )}
              {place.timings && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Open</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TourismPagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 lg:gap-4">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="lg:px-4"
          >
            <svg className="w-4 h-4 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden lg:inline">Previous</span>
          </Button>
          
          <div className="flex items-center gap-1 lg:gap-2">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-500">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => onPageChange(page as number)}
                    className="w-8 h-8 lg:w-10 lg:h-10 p-0"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="lg:px-4"
          >
            <span className="hidden lg:inline">Next</span>
            <svg className="w-4 h-4 lg:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TourismEmptyState({ filters, onClearFilters }: {
  filters: TourismFilters
  onClearFilters: () => void
}) {
  const hasActiveFilters = filters.search || filters.category !== 'all' || filters.city !== 'all'

  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">No tourism places found</h3>
        
        {hasActiveFilters ? (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              No places match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={onClearFilters} variant="outline" className="lg:text-base lg:px-6 lg:py-3">
              Clear All Filters
            </Button>
          </>
        ) : (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No tourism places are currently available.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function TourismSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}