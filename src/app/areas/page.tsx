// src/app/areas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { locationService, businessService, type Area, type City } from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

interface AreaWithCount extends Area {
  businessCount: number
  cityName: string
}

interface LocationResults {
  areas: AreaWithCount[]
  cities: City[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function AllLocationsPage() {
  const [results, setResults] = useState<LocationResults>({
    areas: [],
    cities: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    
    setSearchQuery(search)
    setSelectedCity(city)
    loadLocationsData(search, city, page)
  }, [searchParams])

  const loadLocationsData = async (search: string, cityFilter: string, page: number) => {
    try {
      setLoading(true)
      setError(null)

      // Get all cities first
      const { data: cities, error: citiesError } = await locationService.getCities()
      
      if (citiesError || !cities) {
        throw new Error('Failed to load cities')
      }

      // Get all areas for all cities
      const allAreas: AreaWithCount[] = []
      
      for (const city of cities) {
        try {
          const { data: areas, error: areasError } = await locationService.getAreasByCity(city.id)
          
          if (!areasError && areas) {
            // Get business count for each area
            const areasWithCounts = await Promise.all(
              areas.map(async (area) => {
                try {
                  const { data: businesses } = await businessService.getBusinessesByArea(area.id)
                  return {
                    ...area,
                    businessCount: businesses?.length || 0,
                    cityName: city.name
                  }
                } catch (err) {
                  console.error(`Error getting count for area ${area.slug}:`, err)
                  return {
                    ...area,
                    businessCount: 0,
                    cityName: city.name
                  }
                }
              })
            )
            
            allAreas.push(...areasWithCounts)
          }
        } catch (err) {
          console.error(`Error loading areas for city ${city.name}:`, err)
        }
      }

      // Apply filters
      let filteredAreas = allAreas

      // Filter by city if selected
      if (cityFilter !== 'all') {
        filteredAreas = allAreas.filter(area => area.city_id === cityFilter)
      }

      // Filter by search if provided
      if (search.trim()) {
        filteredAreas = filteredAreas.filter(area =>
          area.name.toLowerCase().includes(search.toLowerCase()) ||
          area.cityName.toLowerCase().includes(search.toLowerCase()) ||
          (area.description && area.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // Sort by business count (descending) then by name
      filteredAreas.sort((a, b) => {
        if (b.businessCount !== a.businessCount) {
          return b.businessCount - a.businessCount
        }
        return a.name.localeCompare(b.name)
      })

      // Calculate pagination
      const totalCount = filteredAreas.length
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedAreas = filteredAreas.slice(startIndex, endIndex)

      setResults({
        areas: paginatedAreas,
        cities,
        totalCount,
        currentPage: page,
        totalPages
      })

    } catch (err) {
      console.error('Error loading locations:', err)
      setError('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (search: string, city: string, page: number = 1) => {
    const params = new URLSearchParams()
    
    if (search.trim()) params.set('search', search.trim())
    if (city !== 'all') params.set('city', city)
    if (page > 1) params.set('page', page.toString())

    const newURL = `/areas${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateURL(value, selectedCity, 1)
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    updateURL(searchQuery, city, 1)
  }

  const handlePageChange = (page: number) => {
    updateURL(searchQuery, selectedCity, page)
  }

  const handleAreaClick = (area: AreaWithCount) => {
    router.push(`/area/${area.slug}`)
  }

  const handleCityClick = (city: City) => {
    // Navigate to city-specific view
    setSelectedCity(city.id)
    updateURL(searchQuery, city.id, 1)
  }

  // SEO metadata
  const getPageTitle = () => {
    if (searchQuery) {
      return `Areas: "${searchQuery}" - Chittor Darpan`
    }
    if (selectedCity !== 'all') {
      const city = results.cities.find(c => c.id === selectedCity)
      return `Areas in ${city?.name || 'City'} - Chittor Darpan`
    }
    return 'All Areas & Locations - Chittor Darpan'
  }

  const getPageDescription = () => {
    return `Browse ${results.totalCount} areas and locations in Chittorgarh. Find businesses by specific neighborhoods, areas, and localities with detailed location information.`
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/areas${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Areas & Locations"
          showBackButton
          showSearch
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search areas..."
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileLocationsContent 
            results={results}
            searchQuery={searchQuery}
            selectedCity={selectedCity}
            loading={loading}
            error={error}
            onCityChange={handleCityChange}
            onAreaClick={handleAreaClick}
            onCityClick={handleCityClick}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopLocationsLayout
          results={results}
          searchQuery={searchQuery}
          selectedCity={selectedCity}
          loading={loading}
          error={error}
          onSearchChange={handleSearchChange}
          onCityChange={handleCityChange}
          onAreaClick={handleAreaClick}
          onCityClick={handleCityClick}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  )
}

// Mobile Content Component
interface LocationsContentProps {
  results: LocationResults
  searchQuery: string
  selectedCity: string
  loading: boolean
  error: string | null
  onCityChange: (city: string) => void
  onAreaClick: (area: AreaWithCount) => void
  onCityClick: (city: City) => void
  onPageChange: (page: number) => void
}

function MobileLocationsContent({
  results,
  searchQuery,
  selectedCity,
  loading,
  error,
  onCityChange,
  onAreaClick,
  onCityClick,
  onPageChange
}: LocationsContentProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Locations</h3>
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
      {/* Locations Header */}
      <LocationsHeader results={results} searchQuery={searchQuery} selectedCity={selectedCity} />

      {/* City Filter */}
      <MobileCityFilter
        cities={results.cities}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
      />

      {/* Cities Overview (when no specific city selected) */}
      {selectedCity === 'all' && !searchQuery && (
        <CitiesOverview cities={results.cities} onCityClick={onCityClick} />
      )}

      {/* Areas Grid */}
      {loading ? (
        <LocationsSkeleton />
      ) : results.areas.length > 0 ? (
        <>
          <div className="space-y-4">
            {results.areas.map(area => (
              <AreaMobileCard
                key={area.id}
                area={area}
                onClick={() => onAreaClick(area)}
                searchQuery={searchQuery}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {results.totalPages > 1 && (
            <LocationsPagination
              currentPage={results.currentPage}
              totalPages={results.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <LocationsEmptyState 
          searchQuery={searchQuery} 
          selectedCity={selectedCity}
          cities={results.cities}
        />
      )}
    </>
  )
}

// Desktop Layout Component
interface DesktopLocationsProps extends LocationsContentProps {
  onSearchChange: (value: string) => void
}

function DesktopLocationsLayout({
  results,
  searchQuery,
  selectedCity,
  loading,
  error,
  onSearchChange,
  onCityChange,
  onAreaClick,
  onCityClick,
  onPageChange
}: DesktopLocationsProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Desktop Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Areas & Locations</h1>
        </div>

        {/* Desktop Search & Filter Bar */}
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
                  placeholder="Search areas and locations..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                />
              </div>
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg min-w-48"
              >
                <option value="all">All Cities</option>
                {results.cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Content */}
      {error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Locations</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <LocationsHeader results={results} searchQuery={searchQuery} selectedCity={selectedCity} />
          
          {/* Cities Overview (desktop) */}
          {selectedCity === 'all' && !searchQuery && (
            <div className="mt-6">
              <DesktopCitiesOverview cities={results.cities} onCityClick={onCityClick} />
            </div>
          )}
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <AreaDesktopCardSkeleton key={i} />
              ))}
            </div>
          ) : results.areas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {results.areas.map(area => (
                  <AreaDesktopCard
                    key={area.id}
                    area={area}
                    onClick={() => onAreaClick(area)}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
              
              {results.totalPages > 1 && (
                <div className="mt-8">
                  <LocationsPagination
                    currentPage={results.currentPage}
                    totalPages={results.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <LocationsEmptyState 
              searchQuery={searchQuery} 
              selectedCity={selectedCity}
              cities={results.cities}
            />
          )}
        </>
      )}
    </div>
  )
}

// Shared Components

function LocationsHeader({ results, searchQuery, selectedCity }: { 
  results: LocationResults
  searchQuery: string
  selectedCity: string
}) {
  const getHeaderText = () => {
    if (searchQuery) {
      return `Areas matching "${searchQuery}"`
    }
    if (selectedCity !== 'all') {
      const city = results.cities.find(c => c.id === selectedCity)
      return `Areas in ${city?.name || 'Selected City'}`
    }
    return 'All Areas & Locations'
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
              {results.totalCount} areas found
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

function MobileCityFilter({ cities, selectedCity, onCityChange }: {
  cities: City[]
  selectedCity: string
  onCityChange: (city: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter by City</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="all">All Cities</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  )
}

function CitiesOverview({ cities, onCityClick }: {
  cities: City[]
  onCityClick: (city: City) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Browse by City</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {cities.map(city => (
            <Button
              key={city.id}
              variant="outline"
              onClick={() => onCityClick(city)}
              className="justify-start h-auto p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-gray-500">{city.state}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DesktopCitiesOverview({ cities, onCityClick }: {
  cities: City[]
  onCityClick: (city: City) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Browse by City</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map(city => (
            <Button
              key={city.id}
              variant="outline"
              onClick={() => onCityClick(city)}
              className="justify-start h-auto p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">{city.name}</div>
                  <div className="text-gray-500">{city.state}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AreaMobileCard({ area, onClick, searchQuery }: {
  area: AreaWithCount
  onClick: () => void
  searchQuery: string
}) {
  // Highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Area Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-green-200 group-hover:to-green-300 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Area Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {highlightText(area.name, searchQuery)}
              </h3>
              <Badge 
                variant={area.businessCount > 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {area.businessCount}
              </Badge>
            </div>
            
            {/* City */}
            <p className="text-sm text-gray-600 mb-2">
              {highlightText(area.cityName, searchQuery)}
            </p>
            
            {/* Description */}
            {area.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {highlightText(area.description, searchQuery)}
              </p>
            )}
            
            {/* Business Count */}
            <p className="text-xs text-gray-500">
              {area.businessCount} business{area.businessCount !== 1 ? 'es' : ''} in this area
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AreaDesktopCard({ area, onClick, searchQuery }: {
  area: AreaWithCount
  onClick: () => void
  searchQuery: string
}) {
  // Highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1" 
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Area Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-green-200 group-hover:to-green-300 group-hover:scale-110 transition-all duration-300">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        {/* Area Info */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-green-600 transition-colors">
            {highlightText(area.name, searchQuery)}
          </h3>
          
          <p className="text-gray-600 mb-3">
            {highlightText(area.cityName, searchQuery)}
          </p>
          
          {area.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {highlightText(area.description, searchQuery)}
            </p>
          )}
          
          <Badge 
            variant={area.businessCount > 0 ? "default" : "secondary"}
            className="text-sm px-3 py-1"
          >
            {area.businessCount} business{area.businessCount !== 1 ? 'es' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function LocationsPagination({ currentPage, totalPages, onPageChange }: {
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

function LocationsEmptyState({ searchQuery, selectedCity, cities }: {
  searchQuery: string
  selectedCity: string
  cities: City[]
}) {
  const selectedCityName = cities.find(c => c.id === selectedCity)?.name
  
  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">No areas found</h3>
        
        {searchQuery && selectedCity !== 'all' ? (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No areas match "{searchQuery}" in {selectedCityName}.
          </p>
        ) : searchQuery ? (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No areas match "{searchQuery}". Try a different search term.
          </p>
        ) : selectedCity !== 'all' ? (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No areas found in {selectedCityName}.
          </p>
        ) : (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No areas are currently available.
          </p>
        )}
        
        <Button onClick={() => window.location.href = '/'} className="lg:text-base lg:px-6 lg:py-3">
          Back to Home
        </Button>
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function LocationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <AreaMobileCardSkeleton key={i} />
      ))}
    </div>
  )
}

function AreaMobileCardSkeleton() {
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

function AreaDesktopCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-full mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-auto animate-pulse mt-3"></div>
        </div>
      </CardContent>
    </Card>
  )
}