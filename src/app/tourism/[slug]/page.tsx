// src/app/tourism/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { tourismService } from '@/lib/database'
import { type TourismPlace } from '@/types/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Head from 'next/head'

export default function TourismPlacePage() {
  const [place, setPlace] = useState<TourismPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      loadTourismPlace()
    }
  }, [slug])

  const loadTourismPlace = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await tourismService.getTourismPlaceBySlug(slug)

      if (fetchError) {
        setError('Tourism place not found')
        return
      }

      if (!data) {
        setError('Tourism place not found')
        return
      }

      setPlace(data)

    } catch (err) {
      console.error('Error loading tourism place:', err)
      setError('Failed to load tourism place')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <TourismPlacePageSkeleton />
  }

  if (error || !place) {
    return <TourismPlaceNotFound error={error} />
  }

  return (
    <>
      <Head>
        <title>{place.meta_title || `${place.name} - Tourism - Chittor Darpan`}</title>
        <meta name="description" content={place.meta_description || place.short_description || place.description || `Visit ${place.name} in ${place.city_name}`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://chittordarpan.com/tourism/${place.slug}`} />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="place" />
        <meta property="og:title" content={place.name} />
        <meta property="og:description" content={place.short_description || place.description || `Visit ${place.name}`} />
        <meta property="og:url" content={`https://chittordarpan.com/tourism/${place.slug}`} />
        
        {/* Location data */}
        {place.latitude && place.longitude && (
          <>
            <meta property="place:location:latitude" content={place.latitude.toString()} />
            <meta property="place:location:longitude" content={place.longitude.toString()} />
          </>
        )}
      </Head>

      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title={place.name}
          showBackButton
          onBackClick={() => router.push('/tourism')}
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileTourismPlaceContent place={place} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <DesktopTourismPlaceContent place={place} />
        </div>
      </div>
    </>
  )
}

// Mobile Content Component
function MobileTourismPlaceContent({ place }: { place: TourismPlace }) {
  return (
    <>
      {/* Hero Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏛️</span>
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
                    <Badge variant="outline">
                      {place.category_name}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        {place.entry_fee && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mb-1">Entry Fee</p>
              <p className="text-sm font-medium text-gray-900">{place.entry_fee}</p>
            </CardContent>
          </Card>
        )}

        {place.duration && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mb-1">Duration</p>
              <p className="text-sm font-medium text-gray-900">{place.duration}</p>
            </CardContent>
          </Card>
        )}

        {place.timings && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mb-1">Timings</p>
              <p className="text-sm font-medium text-gray-900">{place.timings}</p>
            </CardContent>
          </Card>
        )}

        {place.best_time_to_visit && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 mb-1">Best Time</p>
              <p className="text-sm font-medium text-gray-900">{place.best_time_to_visit}</p>
            </CardContent>
          </Card>
        )}
      </div>

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
      {place.address && (
        <Card>
          <CardHeader>
            <CardTitle>Location & Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    View on Google Maps
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Places */}
      <Card>
        <CardHeader>
          <CardTitle>More Tourism Places</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/tourism'}
              className="flex-1"
            >
              Browse All Places
            </Button>
            {place.category_name && (
              <Button 
                variant="outline"
                onClick={() => {
                  if (place.category_name) {
                    window.location.href = `/tourism?category=${place.category_name.toLowerCase().replace(/ /g, '-')}`;
                  }
                }}
                className="flex-1"
              >
                More {place.category_name}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Desktop Content Component
function DesktopTourismPlaceContent({ place }: { place: TourismPlace }) {
  return (
    <>
      {/* Header Navigation */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tourism
        </Button>

        {/* Hero Section */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🏛️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {place.name}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
          {place.address && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Location & Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-lg mb-2">{place.address}</p>
                    <p className="text-gray-600 text-base mb-4">
                      {place.area_name ? `${place.area_name}, ` : ''}{place.city_name}
                    </p>
                    
                    {place.latitude && place.longitude && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`https://maps.google.com?q=${place.latitude},${place.longitude}`, '_blank')}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                        View on Google Maps
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {place.entry_fee && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entry Fee</p>
                    <p className="font-medium text-gray-900">{place.entry_fee}</p>
                  </div>
                </div>
              )}

              {place.timings && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timings</p>
                    <p className="font-medium text-gray-900">{place.timings}</p>
                  </div>
                </div>
              )}

              {place.duration && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-900">{place.duration}</p>
                  </div>
                </div>
              )}

              {place.best_time_to_visit && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Best Time to Visit</p>
                    <p className="font-medium text-gray-900">{place.best_time_to_visit}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Actions */}
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  More {place.category_name}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

// Loading Skeleton Component
function TourismPlacePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Skeleton */}
      <div className="block lg:hidden">
        <div className="h-14 bg-white border-b animate-pulse"></div>
        <div className="px-4 py-6 space-y-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6">
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden lg:block">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse mb-8"></div>
          <div className="bg-white rounded-lg p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Not Found Component
function TourismPlaceNotFound({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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