// src/app/business/[slug]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { businessService, type Business } from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BusinessReviews from '@/components/reviews/business-reviews'

interface BusinessDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const resolvedParams = use(params)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchBusiness()
  }, [resolvedParams.slug])

  const fetchBusiness = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all published businesses and find by slug
      const { data: businesses, error: fetchError } = await businessService.getBusinesses({
        status: 'published',
        limit: 1000 // Get all to find by slug
      })

      if (fetchError) {
        throw new Error('Failed to load business')
      }

      const foundBusiness = businesses?.find(b => b.slug === resolvedParams.slug)
      
      if (!foundBusiness) {
        notFound()
        return
      }

      setBusiness(foundBusiness)
    } catch (err) {
      console.error('Error fetching business:', err)
      setError('Failed to load business details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Loading..." showBackButton />
        <div className="px-4 py-6">
          <BusinessDetailSkeleton />
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Business Not Found" showBackButton />
        <div className="px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Not Found</h2>
              <p className="text-gray-600 mb-4">
                This business may have been removed or the link is incorrect.
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
      <MobileHeader title={business.name} showBackButton />
      
      <div className="px-4 py-6 space-y-6">
        {/* Business Header */}
        <BusinessHeader business={business} />

        {/* Contact Actions */}
        <ContactActions business={business} />

        {/* Business Details */}
        <BusinessDetails business={business} />

        {/* Business Hours */}
        <BusinessHours business={business} />

        {/* Location */}
        <LocationSection business={business} />

        {/* Additional Info */}
        <AdditionalInfo business={business} />

         {/* Reviews Section - ADD HERE */}
      <BusinessReviews 
        businessId={business.id}
        businessName={business.name}
        showAddReview={true}
      />
      </div>
    </div>
  )
}

// Business Header Component
function BusinessHeader({ business }: { business: Business }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Business Name & Status */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {business.name}
              </h1>
              <div className="flex gap-2">
                {business.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </Badge>
                )}
                {business.is_featured && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">
                {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
              </span>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div>
              <p className="text-gray-700 leading-relaxed">{business.description}</p>
            </div>
          )}

          {/* Business Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {business.established_year && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Est. {business.established_year}</span>
              </div>
            )}
            {business.employee_count && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{business.employee_count} employees</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Contact Actions Component
function ContactActions({ business }: { business: Business }) {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleWhatsApp = (whatsapp: string) => {
    const message = encodeURIComponent(`Hi! I found your business "${business.name}" on Chittor Darpan. I'd like to know more about your services.`)
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank')
  }

  const handleWebsite = (website: string) => {
    if (!website.startsWith('http')) {
      website = `https://${website}`
    }
    window.open(website, '_blank')
  }

  const handleEmail = (email: string) => {
    const subject = encodeURIComponent(`Inquiry about ${business.name}`)
    const body = encodeURIComponent(`Hi,\n\nI found your business "${business.name}" on Chittor Darpan and would like to know more about your services.\n\nThanks!`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const contactMethods = []

  if (business.phone && business.phone.length > 0) {
    contactMethods.push({
      type: 'call',
      label: 'Call Now',
      value: business.phone[0],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      action: () => handleCall(business.phone![0])
    })
  }

  if (business.whatsapp) {
    contactMethods.push({
      type: 'whatsapp',
      label: 'WhatsApp',
      value: business.whatsapp,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      action: () => handleWhatsApp(business.whatsapp!)
    })
  }

  if (business.email) {
    contactMethods.push({
      type: 'email',
      label: 'Email',
      value: business.email,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => handleEmail(business.email!)
    })
  }

  if (business.website) {
    contactMethods.push({
      type: 'website',
      label: 'Website',
      value: business.website,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
      ),
      action: () => handleWebsite(business.website!)
    })
  }

  if (contactMethods.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact {business.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactMethods.map((method, index) => (
            <Button
              key={index}
              onClick={method.action}
              className={`h-auto p-4 justify-start gap-3 ${
                method.type === 'call' ? 'bg-green-600 hover:bg-green-700 text-white' :
                method.type === 'whatsapp' ? 'bg-green-500 hover:bg-green-600 text-white' :
                method.type === 'email' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
              fullWidth
            >
              {method.icon}
              <div className="text-left">
                <div className="font-medium">{method.label}</div>
                <div className="text-sm opacity-90 truncate">{method.value}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



// Business Details Component
function BusinessDetails({ business }: { business: Business }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Information</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Address */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Address</h4>
            <p className="text-gray-700">{business.address}</p>
            <p className="text-gray-600 text-sm">
              {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
            </p>
          </div>
        </div>

        {/* All Phone Numbers */}
        {business.phone && business.phone.length > 0 && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
              <div className="space-y-1">
                {business.phone.map((phone, index) => (
                  <p key={index} className="text-gray-700">
                    <a href={`tel:${phone}`} className="hover:text-blue-600 transition-colors">
                      {phone}
                    </a>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        {business.email && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Email</h4>
              <p className="text-gray-700">
                <a href={`mailto:${business.email}`} className="hover:text-blue-600 transition-colors break-all">
                  {business.email}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Website */}
        {business.website && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Website</h4>
              <p className="text-gray-700">
                <a 
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors break-all"
                >
                  {business.website}
                </a>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Business Hours Component (placeholder - will need business_hours table data)
function BusinessHours({ business }: { business: Business }) {
  // TODO: Fetch real business hours from business_hours table
  // For now, show placeholder
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Hours</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-center py-6 text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Business hours not available</p>
          <p className="text-xs">Contact the business for operating hours</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Location Section Component
function LocationSection({ business }: { business: Business }) {
  const handleDirections = () => {
    const query = encodeURIComponent(`${business.address}, ${business.city_name}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Location & Directions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="font-medium text-gray-900 mb-1">{business.address}</p>
          <p className="text-gray-600">
            {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
          </p>
        </div>
        
        <Button
          onClick={handleDirections}
          variant="outline"
          className="w-full justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Get Directions
        </Button>
      </CardContent>
    </Card>
  )
}

// Additional Info Component
function AdditionalInfo({ business }: { business: Business }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 text-sm">
          {business.established_year && (
            <div className="flex justify-between">
              <span className="text-gray-600">Established</span>
              <span className="font-medium">{business.established_year}</span>
            </div>
          )}
          
          {business.employee_count && (
            <div className="flex justify-between">
              <span className="text-gray-600">Team Size</span>
              <span className="font-medium">{business.employee_count} employees</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Listed Since</span>
            <span className="font-medium">{formatDate(business.created_at)}</span>
          </div>
          
          {business.is_verified && (
            <div className="flex justify-between">
              <span className="text-gray-600">Verification</span>
              <Badge className="bg-blue-100 text-blue-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified Business
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton Component
function BusinessDetailSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
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