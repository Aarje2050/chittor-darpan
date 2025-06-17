// src/app/businesses/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { businessService, categoryService, locationService, type Business, type Category, type City } from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

interface BusinessFilters {
  search: string
  category: string
  city: string
  verified: boolean
  featured: boolean
  sortBy: 'newest' | 'name' | 'verified'
}

interface BusinessResults {
  businesses: Business[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function AllBusinessesPage() {
  const [results, setResults] = useState<BusinessResults>({
    businesses: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  })
  const [filters, setFilters] = useState<BusinessFilters>({
    search: '',
    category: 'all',
    city: 'all',
    verified: false,
    featured: false,
    sortBy: 'newest'
  })
  const [categories, setCategories] = useState<Category[]>([])
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
    const verified = searchParams.get('verified') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const sortBy = (searchParams.get('sort') as BusinessFilters['sortBy']) || 'newest'

    setFilters({
      search,
      category,
      city,
      verified,
      featured,
      sortBy
    })

    loadBusinessesData(search, category, city, page, verified, featured, sortBy)
  }, [searchParams])

  const loadBusinessesData = async (
    search: string,
    category: string,
    city: string,
    page: number,
    verified: boolean,
    featured: boolean,
    sortBy: BusinessFilters['sortBy']
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Load categories and cities in parallel
      const [categoriesResult, citiesResult] = await Promise.all([
        categoryService.getBusinessCategories(),
        locationService.getCities()
      ])

      if (categoriesResult.data) setCategories(categoriesResult.data)
      if (citiesResult.data) setCities(citiesResult.data)

      // Load businesses
      await loadBusinesses(search, category, city, page, verified, featured, sortBy)

    } catch (err) {
      console.error('Error loading businesses page:', err)
      setError('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  const loadBusinesses = async (
    search: string,
    category: string,
    city: string,
    page: number,
    verified: boolean,
    featured: boolean,
    sortBy: BusinessFilters['sortBy']
  ) => {
    try {
      // Build filters
      const businessFilters: any = {
        status: 'published',
        limit: 1000 // Get all, then sort and paginate client-side
      }

      if (search.trim()) {
        businessFilters.search = search.trim()
      }

      if (category !== 'all') {
        businessFilters.categorySlug = category
      }

      if (city !== 'all') {
        businessFilters.cityId = city
      }

      // Get businesses
      let { data: businesses, error: fetchError } = await businessService.getBusinesses(businessFilters)

      if (fetchError) {
        throw new Error('Failed to load businesses')
      }

      businesses = businesses || []

      // Apply additional filters
      if (verified) {
        businesses = businesses.filter(b => b.is_verified)
      }

      if (featured) {
        businesses = businesses.filter(b => b.is_featured)
      }

      // Apply sorting
      businesses = sortBusinesses(businesses, sortBy)

      // Calculate pagination
      const totalCount = businesses.length
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedBusinesses = businesses.slice(startIndex, endIndex)

      setResults({
        businesses: paginatedBusinesses,
        totalCount,
        currentPage: page,
        totalPages
      })

    } catch (err) {
      console.error('Error loading businesses:', err)
      setError('Failed to load businesses')
    }
  }

  const sortBusinesses = (businesses: Business[], sortBy: BusinessFilters['sortBy']) => {
    switch (sortBy) {
      case 'name':
        return [...businesses].sort((a, b) => a.name.localeCompare(b.name))
      case 'verified':
        return [...businesses].sort((a, b) => {
          if (a.is_verified && !b.is_verified) return -1
          if (!a.is_verified && b.is_verified) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      case 'newest':
      default:
        return [...businesses].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
  }

  const updateURL = (newFilters: Partial<BusinessFilters>, page: number = 1) => {
    const params = new URLSearchParams()
    
    if (newFilters.search?.trim()) params.set('search', newFilters.search.trim())
    if (newFilters.category && newFilters.category !== 'all') params.set('category', newFilters.category)
    if (newFilters.city && newFilters.city !== 'all') params.set('city', newFilters.city)
    if (newFilters.verified) params.set('verified', 'true')
    if (newFilters.featured) params.set('featured', 'true')
    if (newFilters.sortBy && newFilters.sortBy !== 'newest') params.set('sort', newFilters.sortBy)
    if (page > 1) params.set('page', page.toString())

    const newURL = `/businesses${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }

  const handleFilterChange = (newFilters: Partial<BusinessFilters>) => {
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
      return `Businesses: "${filters.search}" - Chittor Darpan`
    }
    if (filters.category !== 'all') {
      const category = categories.find(c => c.slug === filters.category)
      return `${category?.name || 'Category'} Businesses - Chittor Darpan`
    }
    return 'All Businesses - Chittor Darpan'
  }

  const getPageDescription = () => {
    return `Browse ${results.totalCount} local businesses in Chittorgarh. Find restaurants, shops, services and more with verified listings and contact information.`
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/businesses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="All Businesses"
          showBackButton
          showSearch
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange({ search: value })}
          searchPlaceholder="Search businesses..."
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileBusinessesContent 
            results={results}
            filters={filters}
            categories={categories}
            cities={cities}
            loading={loading}
            error={error}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onBusinessClick={(business) => router.push(`/business/${business.slug}`)}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopBusinessesLayout
          results={results}
          filters={filters}
          categories={categories}
          cities={cities}
          loading={loading}
          error={error}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onBusinessClick={(business) => router.push(`/business/${business.slug}`)}
        />
      </div>
    </>
  )
}

// Mobile Content Component
interface BusinessesContentProps {
  results: BusinessResults
  filters: BusinessFilters
  categories: Category[]
  cities: City[]
  loading: boolean
  error: string | null
  onFilterChange: (filters: Partial<BusinessFilters>) => void
  onPageChange: (page: number) => void
  onBusinessClick: (business: Business) => void
}

function MobileBusinessesContent({
  results,
  filters,
  categories,
  cities,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onBusinessClick
}: BusinessesContentProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Businesses</h3>
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
      <BusinessesHeader results={results} filters={filters} />

      {/* Filters & Sort */}
      <MobileBusinessFilters
        filters={filters}
        categories={categories}
        cities={cities}
        onFilterChange={onFilterChange}
      />

      {/* Results */}
      {loading ? (
        <BusinessesSkeleton />
      ) : results.businesses.length > 0 ? (
        <>
          <div className="space-y-4">
            {results.businesses.map(business => (
              <BusinessListCard
                key={business.id}
                business={business}
                onClick={() => onBusinessClick(business)}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {results.totalPages > 1 && (
            <BusinessesPagination
              currentPage={results.currentPage}
              totalPages={results.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <BusinessesEmptyState 
          filters={filters} 
          onClearFilters={() => onFilterChange({
            search: '',
            category: 'all',
            city: 'all',
            verified: false,
            featured: false,
            sortBy: 'newest'
          })} 
        />
      )}
    </>
  )
}

// Desktop Layout Component
function DesktopBusinessesLayout({
  results,
  filters,
  categories,
  cities,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onBusinessClick
}: BusinessesContentProps) {
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
            <h1 className="text-3xl font-bold text-gray-900">All Businesses</h1>
          </div>

          {/* Desktop Sort */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as BusinessFilters['sortBy'] })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="verified">Verified First</option>
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
                  placeholder="Search businesses..."
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
          <DesktopBusinessFilters
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Businesses</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <BusinessesHeader results={results} filters={filters} />
              
              {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BusinessListCardSkeleton key={i} />
                  ))}
                </div>
              ) : results.businesses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                    {results.businesses.map(business => (
                      <BusinessListCard
                        key={business.id}
                        business={business}
                        onClick={() => onBusinessClick(business)}
                      />
                    ))}
                  </div>
                  
                  {results.totalPages > 1 && (
                    <div className="mt-8">
                      <BusinessesPagination
                        currentPage={results.currentPage}
                        totalPages={results.totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <BusinessesEmptyState 
                  filters={filters} 
                  onClearFilters={() => onFilterChange({
                    search: '',
                    category: 'all',
                    city: 'all',
                    verified: false,
                    featured: false,
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

function BusinessesHeader({ results, filters }: { results: BusinessResults; filters: BusinessFilters }) {
  const getHeaderText = () => {
    if (filters.search) {
      return `Businesses matching "${filters.search}"`
    }
    if (filters.category !== 'all') {
      return `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Businesses`
    }
    return 'All Businesses'
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
              {results.totalCount} businesses found
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

function MobileBusinessFilters({ filters, categories, cities, onFilterChange }: {
  filters: BusinessFilters
  categories: Category[]
  cities: City[]
  onFilterChange: (filters: Partial<BusinessFilters>) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filters & Sort</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as BusinessFilters['sortBy'] })}
            className="text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="newest">Newest</option>
            <option value="name">A-Z</option>
            <option value="verified">Verified</option>
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

        {/* Quick Filters */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => onFilterChange({ verified: e.target.checked })}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Verified only</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => onFilterChange({ featured: e.target.checked })}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Featured only</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

function DesktopBusinessFilters({ filters, categories, cities, onFilterChange }: {
  filters: BusinessFilters
  categories: Category[]
  cities: City[]
  onFilterChange: (filters: Partial<BusinessFilters>) => void
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

          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Quick Filters</h4>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => onFilterChange({ verified: e.target.checked })}
                className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
              />
              <span className="text-sm text-gray-700">Verified businesses</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => onFilterChange({ featured: e.target.checked })}
                className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
              />
              <span className="text-sm text-gray-700">Featured businesses</span>
            </label>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => onFilterChange({
              category: 'all',
              city: 'all',
              verified: false,
              featured: false
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

function BusinessListCard({ business, onClick }: {
  business: Business
  onClick: () => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) return 'New'
    if (diffDays <= 30) return 'Recent'
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={onClick}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start gap-4">
          {/* Business Avatar */}
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
            <span className="text-lg lg:text-xl">🏢</span>
          </div>
          
          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-base lg:text-lg group-hover:text-blue-600 transition-colors truncate">
                {business.name}
              </h3>
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
                {formatDate(business.created_at) && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {formatDate(business.created_at)}
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
                {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
              </span>
            </div>
            
            {/* Description */}
            {business.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {business.description}
              </p>
            )}
            
            {/* Contact Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {business.phone && business.phone.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Phone</span>
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

function BusinessesPagination({ currentPage, totalPages, onPageChange }: {
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

function BusinessesEmptyState({ filters, onClearFilters }: {
  filters: BusinessFilters
  onClearFilters: () => void
}) {
  const hasActiveFilters = filters.search || filters.category !== 'all' || filters.city !== 'all' || filters.verified || filters.featured

  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">No businesses found</h3>
        
        {hasActiveFilters ? (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              No businesses match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={onClearFilters} variant="outline" className="lg:text-base lg:px-6 lg:py-3">
              Clear All Filters
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              No businesses are currently listed. Be the first to add your business!
            </p>
            <Button onClick={() => window.location.href = '/login'} className="lg:text-base lg:px-6 lg:py-3">
              Add Your Business
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function BusinessesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <BusinessListCardSkeleton key={i} />
      ))}
    </div>
  )
}

function BusinessListCardSkeleton() {
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