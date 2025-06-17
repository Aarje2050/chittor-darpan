// src/app/categories/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { categoryService, businessService, type Category } from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

interface CategoryWithCount extends Category {
  businessCount: number
}

interface CategoryResults {
  categories: CategoryWithCount[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function AllCategoriesPage() {
  const [results, setResults] = useState<CategoryResults>({
    categories: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    
    setSearchQuery(search)
    loadCategoriesData(search, page)
  }, [searchParams])

  const loadCategoriesData = async (search: string, page: number) => {
    try {
      setLoading(true)
      setError(null)

      // Get all categories
      const { data: categories, error: categoriesError } = await categoryService.getBusinessCategories()
      
      if (categoriesError || !categories) {
        throw new Error('Failed to load categories')
      }

      // Get business counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          try {
            const { data: businesses } = await businessService.getBusinessesByCategory(category.slug)
            return {
              ...category,
              businessCount: businesses?.length || 0
            }
          } catch (err) {
            console.error(`Error getting count for category ${category.slug}:`, err)
            return {
              ...category,
              businessCount: 0
            }
          }
        })
      )

      // Filter by search if provided
      let filteredCategories = categoriesWithCounts
      if (search.trim()) {
        filteredCategories = categoriesWithCounts.filter(category =>
          category.name.toLowerCase().includes(search.toLowerCase()) ||
          (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // Sort by business count (descending) then by name
      filteredCategories.sort((a, b) => {
        if (b.businessCount !== a.businessCount) {
          return b.businessCount - a.businessCount
        }
        return a.name.localeCompare(b.name)
      })

      // Calculate pagination
      const totalCount = filteredCategories.length
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

      setResults({
        categories: paginatedCategories,
        totalCount,
        currentPage: page,
        totalPages
      })

    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (search: string, page: number = 1) => {
    const params = new URLSearchParams()
    
    if (search.trim()) params.set('search', search.trim())
    if (page > 1) params.set('page', page.toString())

    const newURL = `/categories${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateURL(value, 1) // Reset to page 1 when search changes
  }

  const handlePageChange = (page: number) => {
    updateURL(searchQuery, page)
  }

  const handleCategoryClick = (category: CategoryWithCount) => {
    router.push(`/category/${category.slug}`)
  }

  // SEO metadata
  const getPageTitle = () => {
    if (searchQuery) {
      return `Categories: "${searchQuery}" - Chittor Darpan`
    }
    return 'All Business Categories - Chittor Darpan'
  }

  const getPageDescription = () => {
    return `Browse ${results.totalCount} business categories in Chittorgarh. Find restaurants, shops, services, medical facilities and more local businesses by category.`
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Categories"
          showBackButton
          showSearch
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search categories..."
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileCategoriesContent 
            results={results}
            searchQuery={searchQuery}
            loading={loading}
            error={error}
            onCategoryClick={handleCategoryClick}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopCategoriesLayout
          results={results}
          searchQuery={searchQuery}
          loading={loading}
          error={error}
          onSearchChange={handleSearchChange}
          onCategoryClick={handleCategoryClick}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  )
}

// Mobile Content Component
interface CategoriesContentProps {
  results: CategoryResults
  searchQuery: string
  loading: boolean
  error: string | null
  onCategoryClick: (category: CategoryWithCount) => void
  onPageChange: (page: number) => void
}

function MobileCategoriesContent({
  results,
  searchQuery,
  loading,
  error,
  onCategoryClick,
  onPageChange
}: CategoriesContentProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
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
      {/* Categories Header */}
      <CategoriesHeader results={results} searchQuery={searchQuery} />

      {/* Categories Grid */}
      {loading ? (
        <CategoriesSkeleton />
      ) : results.categories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {results.categories.map(category => (
              <CategoryMobileCard
                key={category.id}
                category={category}
                onClick={() => onCategoryClick(category)}
                searchQuery={searchQuery}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {results.totalPages > 1 && (
            <CategoriesPagination
              currentPage={results.currentPage}
              totalPages={results.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <CategoriesEmptyState searchQuery={searchQuery} />
      )}
    </>
  )
}

// Desktop Layout Component
interface DesktopCategoriesProps extends CategoriesContentProps {
  onSearchChange: (value: string) => void
}

function DesktopCategoriesLayout({
  results,
  searchQuery,
  loading,
  error,
  onSearchChange,
  onCategoryClick,
  onPageChange
}: DesktopCategoriesProps) {
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
          <h1 className="text-3xl font-bold text-gray-900">Business Categories</h1>
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
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                />
              </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <CategoriesHeader results={results} searchQuery={searchQuery} />
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <CategoryDesktopCardSkeleton key={i} />
              ))}
            </div>
          ) : results.categories.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
                {results.categories.map(category => (
                  <CategoryDesktopCard
                    key={category.id}
                    category={category}
                    onClick={() => onCategoryClick(category)}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
              
              {results.totalPages > 1 && (
                <div className="mt-8">
                  <CategoriesPagination
                    currentPage={results.currentPage}
                    totalPages={results.totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <CategoriesEmptyState searchQuery={searchQuery} />
          )}
        </>
      )}
    </div>
  )
}

// Shared Components

function CategoriesHeader({ results, searchQuery }: { 
  results: CategoryResults
  searchQuery: string 
}) {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {searchQuery ? `Categories matching "${searchQuery}"` : 'All Categories'}
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              {results.totalCount} categories found
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

function CategoryMobileCard({ category, onClick, searchQuery }: {
  category: CategoryWithCount
  onClick: () => void
  searchQuery: string
}) {
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'restaurants': '🍽️',
      'hotels': '🏨',
      'shops': '🛍️',
      'services': '🔧',
      'medical': '🏥',
      'education': '📚',
      'beauty': '💄',
      'automotive': '🚗',
      'electronics': '📱',
      'fashion': '👕',
      'grocery': '🛒',
      'pharmacy': '💊'
    }
    return iconMap[categoryName.toLowerCase()] || '🏢'
  }

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
      <CardContent className="p-4 text-center">
        {/* Category Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
          <span className="text-2xl">{getCategoryIcon(category.name)}</span>
        </div>
        
        {/* Category Info */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
            {highlightText(category.name, searchQuery)}
          </h3>
          <p className="text-xs text-gray-600 mb-2">
            {category.businessCount} business{category.businessCount !== 1 ? 'es' : ''}
          </p>
          
          {/* Business Count Badge */}
          <Badge 
            variant={category.businessCount > 0 ? "default" : "secondary"}
            className="text-xs"
          >
            {category.businessCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDesktopCard({ category, onClick, searchQuery }: {
  category: CategoryWithCount
  onClick: () => void
  searchQuery: string
}) {
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'restaurants': '🍽️',
      'hotels': '🏨',
      'shops': '🛍️',
      'services': '🔧',
      'medical': '🏥',
      'education': '📚',
      'beauty': '💄',
      'automotive': '🚗',
      'electronics': '📱',
      'fashion': '👕',
      'grocery': '🛒',
      'pharmacy': '💊'
    }
    return iconMap[categoryName.toLowerCase()] || '🏢'
  }

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
      <CardContent className="p-6 text-center">
        {/* Category Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 group-hover:scale-110 transition-all duration-300">
          <span className="text-3xl">{getCategoryIcon(category.name)}</span>
        </div>
        
        {/* Category Info */}
        <div>
          <h3 className="font-semibold text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
            {highlightText(category.name, searchQuery)}
          </h3>
          
          {category.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {highlightText(category.description, searchQuery)}
            </p>
          )}
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant={category.businessCount > 0 ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {category.businessCount} business{category.businessCount !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoriesPagination({ currentPage, totalPages, onPageChange }: {
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

function CategoriesEmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">
          {searchQuery ? 'No categories found' : 'No categories available'}
        </h3>
        
        {searchQuery ? (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No categories match "{searchQuery}". Try a different search term.
          </p>
        ) : (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No business categories are currently available.
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
function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CategoryMobileCardSkeleton key={i} />
      ))}
    </div>
  )
}

function CategoryMobileCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDesktopCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-full mx-auto animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-auto animate-pulse mt-3"></div>
        </div>
      </CardContent>
    </Card>
  )
}