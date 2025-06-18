// src/app/blog/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { wordpressService } from '@/lib/wordpress'
import { type BlogResults, type BlogFilters } from '@/types/wordpress'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

// Main content component that uses useSearchParams
function BlogPageContent() {
  const [results, setResults] = useState<BlogResults>({
    posts: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0,
      hasNextPage: false,
      hasPrevPage: false
    },
    categories: []
  })
  const [filters, setFilters] = useState<BlogFilters>({
    search: '',
    category: '',
    page: 1,
    per_page: 10
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize from URL params
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')

    setFilters({
      search,
      category,
      page,
      per_page: 10
    })

    loadBlogData(search, category, page)
  }, [searchParams])

  const loadBlogData = async (search: string, category: string, page: number) => {
    try {
      setLoading(true)
      setError(null)

      const blogFilters: BlogFilters = {
        page,
        per_page: 10
      }

      if (search.trim()) {
        blogFilters.search = search.trim()
      }

      if (category) {
        blogFilters.category = category
      }

      const { data, error: blogError } = await wordpressService.getPosts(blogFilters)

      if (blogError) {
        throw new Error('Failed to load blog posts')
      }

      if (data) {
        setResults(data)
      }

    } catch (err) {
      console.error('Error loading blog data:', err)
      setError('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (newFilters: Partial<BlogFilters>, page: number = 1) => {
    const params = new URLSearchParams()
    
    if (newFilters.search?.trim()) params.set('search', newFilters.search.trim())
    if (newFilters.category) params.set('category', newFilters.category)
    if (page > 1) params.set('page', page.toString())

    const newURL = `/blog${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }

  const handleFilterChange = (newFilters: Partial<BlogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    updateURL(updatedFilters, 1) // Reset to page 1 when filters change
  }

  const handlePageChange = (page: number) => {
    updateURL(filters, page)
  }

  const handlePostClick = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  // SEO metadata
  const getPageTitle = () => {
    if (filters.search) {
      return `Blog: "${filters.search}" - Chittor Darpan`
    }
    if (filters.category) {
      const category = results.categories.find(c => c.slug === filters.category)
      return `${category?.name || 'Category'} Blog Posts - Chittor Darpan`
    }
    return 'Blog - Chittor Darpan'
  }

  const getPageDescription = () => {
    return `Read our latest blog posts about Chittorgarh, local news, business insights, and community stories. ${results.pagination.totalPosts} articles available.`
  }

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/blog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title="Blog"
          showBackButton
          showSearch
          searchValue={filters.search || ''}
          onSearchChange={(value) => handleFilterChange({ search: value })}
          searchPlaceholder="Search blog posts..."
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileBlogContent 
            results={results}
            filters={filters}
            loading={loading}
            error={error}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onPostClick={handlePostClick}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <DesktopBlogLayout
          results={results}
          filters={filters}
          loading={loading}
          error={error}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onPostClick={handlePostClick}
        />
      </div>
    </>
  )
}

// Main page component with Suspense wrapper
export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  )
}

// Mobile Content Component
interface BlogContentProps {
  results: BlogResults
  filters: BlogFilters
  loading: boolean
  error: string | null
  onFilterChange: (filters: Partial<BlogFilters>) => void
  onPageChange: (page: number) => void
  onPostClick: (slug: string) => void
}

function MobileBlogContent({
  results,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onPostClick
}: BlogContentProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Blog Posts</h3>
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
      {/* Blog Header */}
      <BlogHeader results={results} filters={filters} />

      {/* Category Filter */}
      <BlogCategoryFilter
        categories={results.categories}
        selectedCategory={filters.category || ''}
        onCategoryChange={(category) => onFilterChange({ category })}
      />

      {/* Blog Posts */}
      {loading ? (
        <BlogPostsSkeleton />
      ) : results.posts.length > 0 ? (
        <>
          <div className="space-y-6">
            {results.posts.map(post => (
              <BlogPostCard
                key={post.id}
                post={post}
                onClick={() => onPostClick(post.slug)}
                searchQuery={filters.search || ''}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <BlogPagination
              currentPage={results.pagination.currentPage}
              totalPages={results.pagination.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <BlogEmptyState 
          filters={filters} 
          onClearFilters={() => onFilterChange({ search: '', category: '' })} 
        />
      )}
    </>
  )
}

// Desktop Layout Component
function DesktopBlogLayout({
  results,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onPostClick
}: BlogContentProps) {
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
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
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
                  placeholder="Search blog posts..."
                  value={filters.search || ''}
                  onChange={(e) => onFilterChange({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="lg:col-span-1">
          <DesktopBlogSidebar
            categories={results.categories}
            selectedCategory={filters.category || ''}
            onCategoryChange={(category) => onFilterChange({ category })}
          />
        </div>

        {/* Desktop Content */}
        <div className="lg:col-span-3">
          {error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Blog Posts</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <BlogHeader results={results} filters={filters} />
              
              {loading ? (
                <div className="space-y-8 mt-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <BlogPostCardSkeleton key={i} />
                  ))}
                </div>
              ) : results.posts.length > 0 ? (
                <>
                  <div className="space-y-8 mt-6">
                    {results.posts.map(post => (
                      <BlogPostCard
                        key={post.id}
                        post={post}
                        onClick={() => onPostClick(post.slug)}
                        searchQuery={filters.search || ''}
                      />
                    ))}
                  </div>
                  
                  {results.pagination.totalPages > 1 && (
                    <div className="mt-8">
                      <BlogPagination
                        currentPage={results.pagination.currentPage}
                        totalPages={results.pagination.totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <BlogEmptyState 
                  filters={filters} 
                  onClearFilters={() => onFilterChange({ search: '', category: '' })} 
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

function BlogHeader({ results, filters }: { results: BlogResults; filters: BlogFilters }) {
  const getHeaderText = () => {
    if (filters.search) {
      return `Blog posts matching "${filters.search}"`
    }
    if (filters.category) {
      const category = results.categories.find(c => c.slug === filters.category)
      return `${category?.name || 'Category'} Posts`
    }
    return 'Latest Blog Posts'
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
              {results.pagination.totalPosts} posts found
              {results.pagination.totalPages > 1 && ` • Page ${results.pagination.currentPage} of ${results.pagination.totalPages}`}
            </p>
          </div>
          <Badge variant="secondary" className="lg:text-sm">
            {results.pagination.totalPosts}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function BlogCategoryFilter({ categories, selectedCategory, onCategoryChange }: {
  categories: any[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.slug}>
              {category.name} ({category.count})
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  )
}

function DesktopBlogSidebar({ categories, selectedCategory, onCategoryChange }: {
  categories: any[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange('')}
              className={`w-full text-left p-2 rounded transition-colors ${
                selectedCategory === '' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={`w-full text-left p-2 rounded transition-colors flex justify-between items-center ${
                  selectedCategory === category.slug 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BlogPostCard({ post, onClick, searchQuery }: {
  post: any
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="lg:w-1/3 flex-shrink-0">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {highlightText(post.title, searchQuery)}
              </h3>
              {post.isSticky && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
              )}
            </div>
            
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              
              {post.author && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{post.author.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{wordpressService.getReadingTime(post.content)} min read</span>
              </div>
            </div>
            
            {/* Excerpt */}
            <p className="text-gray-600 line-clamp-3 mb-4">
              {highlightText(wordpressService.cleanExcerpt(post.excerpt, 200), searchQuery)}
            </p>
            
            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.slice(0, 3).map((category: any) => (
                  <Badge key={category.id} variant="outline" className="text-xs">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Read More */}
            <div className="flex items-center text-blue-600 font-medium">
              <span>Read More</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BlogPagination({ currentPage, totalPages, onPageChange }: {
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

function BlogEmptyState({ filters, onClearFilters }: {
  filters: BlogFilters
  onClearFilters: () => void
}) {
  const hasActiveFilters = filters.search || filters.category

  return (
    <Card>
      <CardContent className="p-8 lg:p-12 text-center">
        <svg className="w-16 h-16 lg:w-20 lg:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
        </svg>
        
        <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2">No blog posts found</h3>
        
        {hasActiveFilters ? (
          <>
            <p className="text-gray-600 mb-4 lg:text-lg">
              No posts match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={onClearFilters} variant="outline" className="lg:text-base lg:px-6 lg:py-3">
              Clear All Filters
            </Button>
          </>
        ) : (
          <p className="text-gray-600 mb-4 lg:text-lg">
            No blog posts are currently available.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function BlogPostsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <BlogPostCardSkeleton key={i} />
      ))}
    </div>
  )
}

function BlogPostCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}