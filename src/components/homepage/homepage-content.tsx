// src/components/homepage/homepage-content.tsx - JustDial Style with Sticky Search
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, ArrowRight, ChevronLeft, ChevronRight, Star, MapPin, TrendingUp,
  // Professional category icons
  UtensilsCrossed, Building2, Stethoscope, GraduationCap, ShoppingBag, 
  Wrench, Car, Sparkles, Home, Plane, Calendar, Dumbbell,
  // Service icons
  Snowflake, PaintBucket, Zap, Brush, Bug, Sparkle,
  // Tourism & other icons
  Castle, Camera, FileText, Users
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { businessService, categoryService, userService, tourismService, type Business, type Category, type TourismPlace } from '@/lib/database'
import { wordpressService, type BlogPost } from '@/lib/wordpress'
import BusinessCardSimple, { BusinessCardSimpleSkeleton } from '@/components/business/business-card-simple'

interface HomeStats {
  businessCount: number
  userCount: number
  publishedBusinessCount: number
  tourismPlaceCount: number
}

export default function HomePageContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const [recentTourismPlaces, setRecentTourismPlaces] = useState<TourismPlace[]>([])
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<HomeStats>({ 
    businessCount: 0, 
    userCount: 0, 
    publishedBusinessCount: 0,
    tourismPlaceCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isSearchSticky, setIsSearchSticky] = useState(false)
  const router = useRouter()

  // Slider states
  const [businessSliderIndex, setBusinessSliderIndex] = useState(0)
  const [servicesSliderIndex, setServicesSliderIndex] = useState(0)

  // Refs for sticky search
  const searchSectionRef = useRef<HTMLDivElement>(null)
  const stickySearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHomeData()
  }, [])

  // Handle sticky search on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) return // Only on mobile
      
      if (searchSectionRef.current) {
        const rect = searchSectionRef.current.getBoundingClientRect()
        setIsSearchSticky(rect.bottom <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)

      const [
        categoriesResult, 
        businessesResult, 
        tourismResult,
        statsResult, 
        userCountResult,
        tourismStatsResult
      ] = await Promise.all([
        categoryService.getBusinessCategories(),
        businessService.getRecentBusinessesWithReviews(12),
        tourismService.getTourismPlaces({ status: 'published', limit: 8 }),
        businessService.getCounts(),
        userService.getCount(),
        tourismService.getTourismCounts()
      ])

      if (categoriesResult.data) {
        setCategories(categoriesResult.data.slice(0, 12))
      }

      if (businessesResult.data) {
        const recent = businessesResult.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 12)
        setRecentBusinesses(recent)
      }

      if (tourismResult.data) {
        setRecentTourismPlaces(tourismResult.data.slice(0, 8))
      }

      // Load WordPress blog posts
      const blogResult = await wordpressService.getRecentPosts(6)
      if (blogResult.data) {
        setRecentBlogs(blogResult.data)
      }

      if (statsResult.data && userCountResult.data !== null && tourismStatsResult.data) {
        setStats({
          businessCount: statsResult.data.total,
          publishedBusinessCount: statsResult.data.published,
          userCount: userCountResult.data,
          tourismPlaceCount: tourismStatsResult.data.published
        })
      }

    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setSearchLoading(true)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Professional categories with proper icons - JustDial style
  const popularCategories = [
    { name: 'Restaurants', icon: UtensilsCrossed, slug: 'restaurants', color: 'text-orange-600', description: 'Food & Dining' },
    { name: 'Hotels', icon: Building2, slug: 'hotels', color: 'text-blue-600', description: 'Stay & Travel' },
    { name: 'Healthcare', icon: Stethoscope, slug: 'healthcare', color: 'text-red-600', description: 'Doctors & Clinics' },
    { name: 'Education', icon: GraduationCap, slug: 'education', color: 'text-purple-600', description: 'Schools & Classes' },
    { name: 'Shopping', icon: ShoppingBag, slug: 'shopping', color: 'text-pink-600', description: 'Retail & Markets' },
    { name: 'Services', icon: Wrench, slug: 'services', color: 'text-green-600', description: 'Professional' },
    { name: 'Automotive', icon: Car, slug: 'automotive', color: 'text-gray-600', description: 'Car Services' },
    { name: 'Beauty', icon: Sparkles, slug: 'beauty', color: 'text-indigo-600', description: 'Salon & Spa' },
    { name: 'Real Estate', icon: Home, slug: 'real-estate', color: 'text-teal-600', description: 'Property' },
    { name: 'Travel', icon: Plane, slug: 'travel', color: 'text-sky-600', description: 'Tours & Trips' },
    { name: 'Events', icon: Calendar, slug: 'events', color: 'text-yellow-600', description: 'Planning' },
    { name: 'Fitness', icon: Dumbbell, slug: 'fitness', color: 'text-emerald-600', description: 'Gym & Sports' }
  ]

  // Home services with professional icons
  const homeServices = [
    { name: 'AC Repair', icon: Snowflake, slug: 'ac-repair', color: 'text-blue-600', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&h=200&fit=crop' },
    { name: 'Plumbers', icon: Wrench, slug: 'plumbers', color: 'text-blue-700', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop' },
    { name: 'Electricians', icon: Zap, slug: 'electricians', color: 'text-yellow-600', image: 'https://images.unsplash.com/photo-1558618047-3c8c76f4c4c7?w=300&h=200&fit=crop' },
    { name: 'Painters', icon: PaintBucket, slug: 'painters', color: 'text-green-600', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&h=200&fit=crop' },
    { name: 'Pest Control', icon: Bug, slug: 'pest-control', color: 'text-red-600', image: 'https://images.unsplash.com/photo-1558618047-3c8c76f4c4c7?w=300&h=200&fit=crop' },
    { name: 'Cleaning', icon: Sparkle, slug: 'cleaning', color: 'text-purple-600', image: 'https://images.unsplash.com/photo-1558618266-fcd25c85cd64?w=300&h=200&fit=crop' }
  ]

  // Slider navigation
  const slideBusinesses = (direction: 'left' | 'right') => {
    const maxIndex = Math.max(0, recentBusinesses.length - 4)
    if (direction === 'right') {
      setBusinessSliderIndex(prev => Math.min(prev + 1, maxIndex))
    } else {
      setBusinessSliderIndex(prev => Math.max(prev - 1, 0))
    }
  }

  const slideServices = (direction: 'left' | 'right') => {
    const maxIndex = Math.max(0, homeServices.length - 4)
    if (direction === 'right') {
      setServicesSliderIndex(prev => Math.min(prev + 1, maxIndex))
    } else {
      setServicesSliderIndex(prev => Math.max(prev - 1, 0))
    }
  }

  if (loading) {
    return <HomePageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Chittor Darpan",
            "alternateName": "Chittorgarh Business Directory",
            "description": "Complete local search engine for Chittorgarh city. Find businesses, restaurants, hotels, services, and attractions.",
            "url": "https://chittordarpan.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://chittordarpan.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {/* Sticky Search Bar for Mobile */}
      {isSearchSticky && (
        <div 
          ref={stickySearchRef}
          className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-blue-100 px-4 py-3 shadow-sm"
        >
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search businesses in Chittorgarh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-0 bg-blue-50/30"
              />
            </div>
          </form>
        </div>
      )}

      <main>
        {/* Hero Search Section - JustDial Style */}
        <section ref={searchSectionRef} className="bg-white py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Title - Only on Desktop */}
            <div className="hidden md:block text-center mb-6">
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Local Businesses in <span className="text-blue-600">Chittorgarh</span>
              </h1>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto mb-6">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="search"
                    placeholder="Search for restaurants, hotels, doctors, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-base md:text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 shadow-sm"
                  />
                  {/* Search Button - Desktop Only */}
                  <Button
                    type="submit"
                    disabled={!searchQuery.trim() || searchLoading}
                    className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center gap-4 md:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-green-600">{stats.publishedBusinessCount}+</span>
                <span>Businesses</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-blue-600">{stats.userCount}+</span>
                <span>Users</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-purple-600">4.8★</span>
                <span>Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Categories - JustDial Style */}
        <section className="py-6 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Popular Categories
              </h2>
              <p className="text-gray-600 text-sm md:text-base">Find what you're looking for</p>
            </div>
            
            {/* Categories Grid - Clean JustDial Style */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-3 md:gap-4">
              {popularCategories.slice(0, typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12).map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.slug}
                    onClick={() => router.push(`/category/${category.slug}`)}
                    className="group p-2 md:p-3 text-center hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    {/* Icon Container */}
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${category.color}`} />
                    </div>
                    
                    {/* Category Name */}
                    <p className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-tight">
                      {category.name}
                    </p>
                    
                    {/* Description - Desktop Only */}
                    <p className="hidden md:block text-xs text-gray-500 mt-1">
                      {category.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="text-center mt-6">
              <Link href="/categories">
                <Button variant="outline" size="sm">
                  View All Categories
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Connect Banner - JustDial Style */}
        <section className="py-6 md:py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-lg md:text-xl lg:text-3xl font-bold mb-2">
                  Connect with <span className="text-yellow-300">{stats.userCount}+ Customers</span>
                </h2>
                <p className="text-blue-100 mb-4 text-sm md:text-base lg:text-lg">
                  Join Chittor Darpan and grow your business in Chittorgarh
                </p>
                <Link href="/add-business">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 px-4 md:px-6 py-2 md:py-3 font-semibold text-sm md:text-base">
                    List your business for <span className="bg-red-500 text-white px-2 py-1 rounded ml-1">FREE</span>
                  </Button>
                </Link>
              </div>
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            </div>
          </div>
        </section>

        {/* Recent Businesses with Reviews */}
        <section className="py-6 md:py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  Recently Added Businesses
                </h2>
                <p className="text-gray-600 text-sm md:text-base">Latest verified listings with reviews</p>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => slideBusinesses('left')}
                  disabled={businessSliderIndex === 0}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => slideBusinesses('right')}
                  disabled={businessSliderIndex >= Math.max(0, recentBusinesses.length - 4)}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Link href="/businesses" className="ml-4">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
            </div>
            
            {/* Desktop Grid */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-4 gap-6">
                {recentBusinesses.slice(businessSliderIndex, businessSliderIndex + 4).map((business) => (
                  <BusinessCardSimple key={business.id} business={business} />
                ))}
              </div>
            </div>

            {/* Mobile & Tablet Horizontal Slider */}
            <div className="lg:hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                {recentBusinesses.map((business) => (
                  <div key={business.id} className="flex-none w-72 md:w-80">
                    <BusinessCardSimple business={business} />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-6 lg:hidden">
              <Link href="/businesses">
                <Button variant="outline">View All Businesses</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Home Services - JustDial Style */}
        <section className="py-6 md:py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  Home Services
                </h2>
                <p className="text-gray-600 text-sm md:text-base">Professional services at your doorstep</p>
              </div>
              
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => slideServices('left')}
                  disabled={servicesSliderIndex === 0}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => slideServices('right')}
                  disabled={servicesSliderIndex >= Math.max(0, homeServices.length - 4)}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Services Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {homeServices.slice(0, typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : homeServices.length).map((service) => {
                const IconComponent = service.icon
                return (
                  <Card 
                    key={service.slug}
                    className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    onClick={() => router.push(`/category/${service.slug}`)}
                  >
                    <div className="aspect-video bg-gray-200 overflow-hidden relative">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Icon Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <IconComponent className={`w-8 h-8 md:w-10 md:h-10 text-white`} />
                      </div>
                    </div>
                    <CardContent className="p-3 md:p-4 text-center">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm md:text-base">
                        {service.name}
                      </h3>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tourism Places */}
        <section className="py-6 md:py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  Places to Visit in Chittorgarh
                </h2>
                <p className="text-gray-600 text-sm md:text-base">Explore historic attractions</p>
              </div>
              <Link href="/tourism" className="hidden lg:block">
                <Button variant="outline">View All Places</Button>
              </Link>
            </div>
            
            {/* Places Grid - Desktop */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-4 gap-6">
                {recentTourismPlaces.slice(0, 4).map((place) => (
                  <Card 
                    key={place.id}
                    className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    onClick={() => router.push(`/tourism/${place.slug}`)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <Castle className="text-4xl lg:text-6xl text-orange-400 opacity-70" />
                    </div>
                    <CardContent className="p-3 lg:p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm lg:text-base mb-1">
                        {place.name}
                      </h3>
                      <p className="text-gray-600 text-xs lg:text-sm line-clamp-2">
                        {place.short_description || place.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Places Slider - Mobile & Tablet */}
            <div className="lg:hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                {recentTourismPlaces.map((place) => (
                  <div key={place.id} className="flex-none w-60 md:w-72">
                    <Card 
                      className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => router.push(`/tourism/${place.slug}`)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        <Castle className="text-4xl text-orange-400 opacity-70" />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm mb-1">
                          {place.name}
                        </h3>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {place.short_description || place.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-6 lg:hidden">
              <Link href="/tourism">
                <Button variant="outline">View All Places</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Latest News */}
        <section className="py-6 md:py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  Latest News & Updates
                </h2>
                <p className="text-gray-600 text-sm md:text-base">Stay informed about Chittorgarh</p>
              </div>
              <Link href="/blog" className="hidden lg:block">
                <Button variant="outline">View All News</Button>
              </Link>
            </div>
            
            {/* News Grid - Desktop */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-3 gap-6">
                {recentBlogs.slice(0, 3).map((post) => (
                  <Card 
                    key={post.id}
                    className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    onClick={() => router.push(`/blog/${post.slug}`)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      {post.featuredImage ? (
                        <img 
                          src={post.featuredImage.url} 
                          alt={post.featuredImage.alt || post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="text-4xl lg:text-6xl text-purple-400 opacity-70" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                        {post.categories[0] && (
                          <Badge variant="secondary" className="text-xs">
                            {post.categories[0].name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {post.excerpt.replace(/<[^>]*>/g, '')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* News Slider - Mobile & Tablet */}
            <div className="lg:hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                {recentBlogs.map((post) => (
                  <div key={post.id} className="flex-none w-72 md:w-80">
                    <Card 
                      className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => router.push(`/blog/${post.slug}`)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        {post.featuredImage ? (
                          <img 
                            src={post.featuredImage.url} 
                            alt={post.featuredImage.alt || post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="text-4xl text-purple-400 opacity-70" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                          {post.categories[0] && (
                            <Badge variant="secondary" className="text-xs">
                              {post.categories[0].name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.excerpt.replace(/<[^>]*>/g, '')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-6 lg:hidden">
              <Link href="/blog">
                <Button variant="outline">View All News</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Custom Styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

// Loading Skeleton Component
function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-8 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-full max-w-2xl mx-auto animate-pulse"></div>
        </div>
      </div>
      
      {/* Categories Skeleton */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-6 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <BusinessCardSimpleSkeleton key={j} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}