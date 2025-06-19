// src/app/tourism/[slug]/page.tsx
'use client'

import { useState, useEffect, Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Head from 'next/head'

// Services
import { tourismService, tourismImageService, tourismReviewService } from '@/lib/database'
import type { TourismPlace, TourismImage } from '@/lib/database'

// Components
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Dynamic imports for performance
const TourismReviews = dynamic(() => import('@/components/tourism/tourism-reviews'), {
  ssr: false,
  loading: () => <ReviewsSkeleton />
})

const TourismGallery = dynamic(() => import('@/components/tourism/tourism-gallery'), {
  ssr: false,
  loading: () => <GallerySkeleton />
})

// Types
interface GalleryImage {
  id: string
  url: string
  alt_text: string | null
  caption: string | null
  type: 'admin' | 'user'
  uploader_name?: string
  created_at: string
  is_featured?: boolean
}

type GalleryFilter = 'all' | 'admin' | 'user' | 'featured'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Main Page Component
export default function TourismPlacePage({ params }: PageProps) {
  // State
  const [place, setPlace] = useState<TourismPlace | null>(null)
  const [adminImages, setAdminImages] = useState<TourismImage[]>([])
  const [userImages, setUserImages] = useState<any[]>([])
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { slug } = use(params)

  // Load tourism place data
  useEffect(() => {
    if (!slug) return
    loadTourismPlace()
  }, [slug])

  const loadTourismPlace = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load tourism place details
      const { data: placeData, error: placeError } = await tourismService.getTourismPlaceBySlug(slug)

      if (placeError || !placeData) {
        setError('Tourism place not found')
        return
      }

      setPlace(placeData)

      // Load images in parallel
      const [adminImagesResult, userImagesResult] = await Promise.allSettled([
        tourismImageService.getTourismPlaceImages(placeData.id),
        tourismReviewService.getAllReviewImages({ placeId: placeData.id })
      ])

      // Handle admin images
      if (adminImagesResult.status === 'fulfilled' && adminImagesResult.value.data) {
        setAdminImages(adminImagesResult.value.data)
      }

      // Handle user review images
      if (userImagesResult.status === 'fulfilled' && userImagesResult.value.data) {
        setUserImages(userImagesResult.value.data)
      }

    } catch (err) {
      console.error('Error loading tourism place:', err)
      setError('Failed to load tourism place')
    } finally {
      setLoading(false)
    }
  }

  // Combine and filter gallery images
  const getGalleryImages = (): GalleryImage[] => {
    const adminGalleryImages: GalleryImage[] = adminImages.map(img => ({
      id: img.id,
      url: img.image_url,
      alt_text: img.alt_text,
      caption: img.caption,
      type: 'admin' as const,
      uploader_name: img.uploader_name,
      created_at: img.created_at,
      is_featured: img.is_featured
    }))

    const userGalleryImages: GalleryImage[] = userImages.map(img => ({
      id: img.id,
      url: img.image_url,
      alt_text: img.alt_text,
      caption: img.caption,
      type: 'user' as const,
      uploader_name: 'Visitor',
      created_at: img.created_at,
      is_featured: false
    }))

    const allImages = [...adminGalleryImages, ...userGalleryImages]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply filter
    switch (galleryFilter) {
      case 'admin':
        return allImages.filter(img => img.type === 'admin')
      case 'user':
        return allImages.filter(img => img.type === 'user')
      case 'featured':
        return allImages.filter(img => img.is_featured)
      default:
        return allImages
    }
  }

  // Loading state
  if (loading) {
    return <PageSkeleton />
  }

  // Error state
  if (error || !place) {
    return <NotFoundPage error={error} />
  }

  // SEO Metadata
  const pageTitle = place.meta_title || `${place.name} - Tourism - Chittor Darpan`
  const pageDescription = place.meta_description || place.short_description || place.description || `Visit ${place.name} in ${place.city_name}`
  const canonicalUrl = `https://chittordarpan.com/tourism/${place.slug}`

  return (
    <>
      {/* SEO Head */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="place" />
        <meta property="og:title" content={place.name} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Chittor Darpan" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={place.name} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Location Schema */}
        {place.latitude && place.longitude && (
          <>
            <meta property="place:location:latitude" content={place.latitude.toString()} />
            <meta property="place:location:longitude" content={place.longitude.toString()} />
          </>
        )}

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TouristAttraction",
              "name": place.name,
              "description": pageDescription,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": place.city_name,
                "addressRegion": place.area_name || place.city_name,
                "addressCountry": "IN"
              },
              ...(place.latitude && place.longitude && {
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": place.latitude,
                  "longitude": place.longitude
                }
              }),
              "url": canonicalUrl,
              "category": place.category_name
            })
          }}
        />
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title={place.name}
          showBackButton
          onBackClick={() => router.push('/tourism')}
        />
        
        <div className="px-4 py-6 space-y-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MobileContent 
              place={place} 
              galleryImages={getGalleryImages()}
              galleryFilter={galleryFilter}
              onGalleryFilterChange={setGalleryFilter}
            />
          </Suspense>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Suspense fallback={<ContentSkeleton />}>
            <DesktopContent 
              place={place}
              galleryImages={getGalleryImages()}
              galleryFilter={galleryFilter}
              onGalleryFilterChange={setGalleryFilter}
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}

// Mobile Content Component
function MobileContent({ 
  place, 
  galleryImages, 
  galleryFilter, 
  onGalleryFilterChange 
}: { 
  place: TourismPlace
  galleryImages: GalleryImage[]
  galleryFilter: GalleryFilter
  onGalleryFilterChange: (filter: GalleryFilter) => void
}) {
  return (
    <>
      {/* Hero Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl" role="img" aria-label="Tourism place">🏛️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {place.name}
                </h1>
                <div className="flex gap-1 flex-shrink-0">
                  {place.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                  {place.category_name && (
                    <Badge variant="outline">{place.category_name}</Badge>
                  )}
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {place.area_name ? `${place.area_name}, ` : ''}{place.city_name}
                </span>
              </div>
            </div>
          </div>

          {/* Short Description */}
          {place.short_description && (
            <p className="text-gray-700 text-base leading-relaxed">
              {place.short_description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gallery Section */}
      <TourismGallery 
        images={galleryImages}
        filter={galleryFilter}
        onFilterChange={onGalleryFilterChange}
        isMobile={true}
      />

      {/* Quick Info Cards */}
      <QuickInfoCards place={place} />

      {/* Description */}
      {place.description && (
        <Card>
          <CardHeader>
            <CardTitle>About {place.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700">
              {place.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location & Address */}
      {place.address && <LocationCard place={place} />}

      {/* Reviews Section */}
      <TourismReviews 
        placeId={place.id} 
        placeName={place.name} 
      />

      {/* Related Places */}
      <RelatedPlacesCard place={place} />
    </>
  )
}

// Desktop Content Component
function DesktopContent({ 
  place,
  galleryImages,
  galleryFilter,
  onGalleryFilterChange
}: { 
  place: TourismPlace
  galleryImages: GalleryImage[]
  galleryFilter: GalleryFilter
  onGalleryFilterChange: (filter: GalleryFilter) => void
}) {
  return (
    <>
      {/* Header Navigation */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tourism
        </Button>

        {/* Hero Section */}
        <HeroSection place={place} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery Section */}
          <TourismGallery 
            images={galleryImages}
            filter={galleryFilter}
            onFilterChange={onGalleryFilterChange}
            isMobile={false}
          />

          {/* Description */}
          {place.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">About {place.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-gray-700 text-base leading-relaxed">
                  {place.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location & Address */}
          {place.address && <LocationCard place={place} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickInfoSidebar place={place} />
          <RelatedPlacesCard place={place} />
        </div>
      </div>
    </>
  )
}

// Reusable Components
function HeroSection({ place }: { place: TourismPlace }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl" role="img" aria-label="Tourism place">🏛️</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {place.name}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-lg">
                    {place.area_name ? `${place.area_name}, ` : ''}{place.city_name}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                {place.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                )}
                {place.category_name && (
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {place.category_name}
                  </Badge>
                )}
              </div>
            </div>

            {place.short_description && (
              <p className="text-xl text-gray-700 leading-relaxed">
                {place.short_description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickInfoCards({ place }: { place: TourismPlace }) {
  const infoItems = [
    { condition: place.entry_fee, icon: '💰', label: 'Entry Fee', value: place.entry_fee, color: 'blue' },
    { condition: place.duration, icon: '⏰', label: 'Duration', value: place.duration, color: 'green' },
    { condition: place.timings, icon: '🕒', label: 'Timings', value: place.timings, color: 'orange' },
    { condition: place.best_time_to_visit, icon: '🌤️', label: 'Best Time', value: place.best_time_to_visit, color: 'purple' }
  ].filter(item => item.condition)

  if (infoItems.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-4">
      {infoItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4 text-center">
            <div className={`w-8 h-8 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-2`}>
              <span className="text-lg" role="img" aria-label={item.label}>{item.icon}</span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-gray-900">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function QuickInfoSidebar({ place }: { place: TourismPlace }) {
  const infoItems = [
    { condition: place.entry_fee, icon: '💰', label: 'Entry Fee', value: place.entry_fee },
    { condition: place.timings, icon: '🕒', label: 'Timings', value: place.timings },
    { condition: place.duration, icon: '⏰', label: 'Duration', value: place.duration },
    { condition: place.best_time_to_visit, icon: '🌤️', label: 'Best Time to Visit', value: place.best_time_to_visit }
  ].filter(item => item.condition)

  if (infoItems.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg" role="img" aria-label={item.label}>{item.icon}</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="font-medium text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LocationCard({ place }: { place: TourismPlace }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Address</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium mb-1">{place.address}</p>
            <p className="text-sm text-gray-600">
              {place.area_name ? `${place.area_name}, ` : ''}{place.city_name}
            </p>
            
            {/* Map Link */}
            {place.latitude && place.longitude && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.open(`https://maps.google.com?q=${place.latitude},${place.longitude}`, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                View on Google Maps
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RelatedPlacesCard({ place }: { place: TourismPlace }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Explore More</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => window.location.href = '/tourism'}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
          </svg>
          All Tourism Places
        </Button>
        
        {place.category_name && (
          <Button 
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              if (place.category_name) {
                window.location.href = `/tourism?category=${place.category_name.toLowerCase().replace(/ /g, '-')}`;
              }
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            More {place.category_name}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Loading Skeletons
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="block lg:hidden">
        <div className="h-14 bg-white border-b animate-pulse" />
        <div className="px-4 py-6 space-y-6">
          <ContentSkeleton />
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse mb-8" />
          <ContentSkeleton />
        </div>
      </div>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        </div>
      </div>
      
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GallerySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Not Found Page
function NotFoundPage({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tourism Place Not Found</h1>
        <p className="text-gray-600 mb-6">
          {error || "The tourism place you're looking for doesn't exist or has been removed."}
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => window.location.href = '/tourism'}>
            Browse Tourism Places
          </Button>
        </div>
      </div>
    </div>
  )
}