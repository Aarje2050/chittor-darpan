// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { businessService, categoryService, userService, type Business, type Category } from '@/lib/database'

interface HomeStats {
  businessCount: number
  userCount: number
  publishedBusinessCount: number
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([])
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const [stats, setStats] = useState<HomeStats>({ businessCount: 0, userCount: 0, publishedBusinessCount: 0 })
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)

      // Load all data in parallel for better performance
      const [categoriesResult, businessesResult, statsResult, userCountResult] = await Promise.all([
        categoryService.getBusinessCategories(),
        businessService.getBusinesses({ status: 'published', limit: 50 }),
        businessService.getCounts(),
        userService.getCount()
      ])

      // Set categories
      if (categoriesResult.data) {
        setCategories(categoriesResult.data.slice(0, 8)) // Show top 8 categories
      }

      // Set businesses
      if (businessesResult.data) {
        const publishedBusinesses = businessesResult.data
        
        // Featured businesses (is_featured = true)
        const featured = publishedBusinesses.filter(b => b.is_featured).slice(0, 3)
        setFeaturedBusinesses(featured)
        
        // Recent businesses (latest 4)
        const recent = publishedBusinesses
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
        setRecentBusinesses(recent)
      }

      // Set stats
      if (statsResult.data && userCountResult.data !== null) {
        setStats({
          businessCount: statsResult.data.total,
          publishedBusinessCount: statsResult.data.published,
          userCount: userCountResult.data
        })
      }

    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearchLoading(true)
      // Navigate to search results page (we'll build this later)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCategoryClick = (category: Category) => {
    router.push(`/category/${category.slug}`)
  }

  const getCategoryIcon = (categoryName: string) => {
    // Map category names to emojis
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Chittor Darpan" showSearch={false} autoHide={false} />
        <HomePageSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Chittor Darpan" showSearch={false} autoHide={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Chittorgarh</h1>
          <p className="text-gray-600">Discover local businesses in your city</p>
          <p className="text-sm text-blue-600">
            <a href="/login" className="underline">Sign in</a> to manage your business listings
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
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
                  placeholder="Search businesses, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searchLoading}
                className="px-6"
              >
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.publishedBusinessCount}</div>
              <div className="text-sm text-gray-600">Active Businesses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.userCount}</div>
              <div className="text-sm text-gray-600">Community Members</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Browse Categories</span>
                <Badge variant="secondary">{categories.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    onClick={() => handleCategoryClick(category)}
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50 touch-manipulation"
                  >
                    <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                    <div className="text-center">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500">Browse businesses</div>
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* View All Categories Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/categories')}
                  className="w-full"
                >
                  View All Categories
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Featured Businesses */}
        {featuredBusinesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Featured Businesses</span>
                <Badge className="bg-purple-100 text-purple-800">⭐ Premium</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {featuredBusinesses.map((business) => (
                  <FeaturedBusinessCard 
                    key={business.id} 
                    business={business}
                    onClick={() => router.push(`/business/${business.slug}`)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Businesses */}
        {recentBusinesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recently Added</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {recentBusinesses.map((business) => (
                  <RecentBusinessCard 
                    key={business.id} 
                    business={business}
                    onClick={() => router.push(`/business/${business.slug}`)}
                  />
                ))}
              </div>
              
              {/* View All Businesses Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/businesses')}
                  className="w-full"
                >
                  View All Businesses
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full justify-start bg-black text-white hover:bg-gray-800"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              List Your Business
            </Button>
            
            <Button 
              onClick={() => router.push('/businesses')}
              variant="outline"
              className="w-full justify-start"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Businesses
            </Button>
            
            <Button 
              onClick={() => router.push('/areas')}
              variant="outline"
              className="w-full justify-start"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Browse by Location
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>About Chittor Darpan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm space-y-2">
            <p className="text-gray-700">
              Chittor Darpan is your local business directory for Chittorgarh. 
              Discover restaurants, shops, services, and more in your neighborhood.
            </p>
            <div className="flex items-center gap-4 pt-2 text-gray-600">
              <span>📱 Mobile-First</span>
              <span>🏢 Local Focus</span>
              <span>✅ Verified Listings</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Featured Business Card Component
interface FeaturedBusinessCardProps {
  business: Business
  onClick: () => void
}

function FeaturedBusinessCard({ business, onClick }: FeaturedBusinessCardProps) {
  return (
    <div 
      onClick={onClick}
      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
          <span className="text-lg">🏢</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{business.name}</h4>
          <p className="text-sm text-gray-600 truncate">
            {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
          </p>
          {business.description && (
            <p className="text-xs text-gray-500 truncate mt-1">{business.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-purple-100 text-purple-800 text-xs">Featured</Badge>
          {business.is_verified && (
            <Badge className="bg-blue-100 text-blue-800 text-xs">Verified</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Recent Business Card Component
interface RecentBusinessCardProps {
  business: Business
  onClick: () => void
}

function RecentBusinessCard({ business, onClick }: RecentBusinessCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div 
      onClick={onClick}
      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
          <span className="text-sm">🏢</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{business.name}</h4>
          <p className="text-sm text-gray-600 truncate">
            {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{formatDate(business.created_at)}</div>
          {business.is_verified && (
            <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">Verified</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton Component
function HomePageSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}