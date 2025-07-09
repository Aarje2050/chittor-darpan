// src/app/business/[slug]/page.tsx - SIMPLE & SEO OPTIMIZED
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { businessService, reviewService, locationService } from '@/lib/database'
import BusinessListingClient from './business-listing-client'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Simple but effective metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  
  try {
    const { data: businesses } = await businessService.getBusinesses({
      status: 'published',
      limit: 1000
    })
    
    const business = businesses?.find(b => b.slug === resolvedParams.slug)
    
    if (!business) {
      return {
        title: 'Business Not Found | Chittor Darpan',
        description: 'The requested business listing could not be found.',
        robots: { index: false, follow: false }
      }
    }

    // Get review stats
    const { data: reviewStats } = await reviewService.getReviewStats(business.id)
    
    // Simple, effective title
    const title = `${business.name} - ${business.city_name} | Chittor Darpan`
    
    // Clear, informative description
    const description = business.description 
      ? `${business.description.substring(0, 140)}... Contact: ${business.phone?.[0] || 'Available'} | Address: ${business.address} | Reviews: ${reviewStats?.totalReviews || 0}`
      : `Find ${business.name} in ${business.city_name}. Contact: ${business.phone?.[0] || 'Available'} | Address: ${business.address} | ${reviewStats?.totalReviews || 0} reviews on Chittor Darpan`

    const businessUrl = `https://chittordarpan.com/business/${business.slug}`
    
    const keywords = [
      business.name,
      business.city_name,
      business.area_name,
      business.category_name,
      'business directory',
      'contact details',
      'Chittor Darpan',
      'Chittorgarh'
    ].filter(Boolean).join(', ')

    return {
      title,
      description,
      keywords,
      
      openGraph: {
        title,
        description: business.description?.substring(0, 150) || description.substring(0, 150),
        url: businessUrl,
        siteName: 'Chittor Darpan',
        type: 'website',
        images: business.cover_image_url ? [
          {
            url: business.cover_image_url,
            width: 1200,
            height: 630,
            alt: `${business.name} - ${business.city_name}`
          }
        ] : [],
        locale: 'en_IN'
      },
      
      twitter: {
        card: 'summary_large_image',
        title: `${business.name} | ${business.city_name}`,
        description: business.description?.substring(0, 150) || description.substring(0, 150),
        images: business.cover_image_url ? [business.cover_image_url] : []
      },
      
      alternates: {
        canonical: businessUrl
      },
      
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Business Listing | Chittor Darpan',
      description: 'Find local businesses in Chittorgarh with contact details and reviews.',
    }
  }
}

export default async function BusinessPage({ params }: PageProps) {
  const resolvedParams = await params
  
  try {
    // Get business data with category information
    const { data: businesses, error } = await businessService.getBusinesses({
      status: 'published',
      limit: 1000 // Consider optimizing this with specific slug query
    })

    if (error || !businesses) {
      console.error('Error fetching businesses:', error)
      notFound()
    }

    const business = businesses.find(b => b.slug === resolvedParams.slug)
    
    // Debug: Check if category_name is properly populated
    if (business && !business.category_name) {
      console.warn(`⚠️ Business ${business.name} is missing category_name. Check database query.`)
      console.log('Business object:', business)
    }
    
    if (business && business.category_name) {
      console.log(`✅ Category found: ${business.category_name} for business: ${business.name}`)
    }
    
    if (!business) {
      notFound()
    }

    // Get additional data
    const [
      { data: reviewStats },
      { data: relatedBusinesses },
      { data: cities },
      { data: areas }
    ] = await Promise.all([
      reviewService.getReviewStats(business.id),
      businessService.getBusinesses({
        status: 'published',
        cityId: business.city_id || undefined,
        limit: 4
      }).then(result => ({
        data: result.data?.filter(b => b.id !== business.id) || []
      })),
      locationService.getCities(),
      business.city_id ? locationService.getAreasByCity(business.city_id) : Promise.resolve({ data: [] })
    ])

    const currentArea = areas?.find(a => a.id === business.area_id)
    const currentCity = cities?.find(c => c.id === business.city_id)

    // Simple but comprehensive structured data
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.description || `${business.name} - Business in ${business.city_name}`,
      "url": `https://chittordarpan.com/business/${business.slug}`,
      "image": business.cover_image_url || business.logo_url,
      "telephone": business.phone?.[0] || "",
      "email": business.email || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": business.address,
        "addressLocality": business.city_name,
        "addressRegion": "Rajasthan",
        "addressCountry": "IN"
      },
      "aggregateRating": reviewStats && reviewStats.totalReviews > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": reviewStats.averageRating,
        "reviewCount": reviewStats.totalReviews,
        "bestRating": 5,
        "worstRating": 1
      } : undefined
    }

    // Breadcrumb schema - matches the new visual breadcrumb structure  
    const breadcrumbItems = [
      {
        position: 1,
        name: "Home",
        item: "https://chittordarpan.com"
      }
    ]

    let currentPosition = 2

    // Add area if available (instead of city)
    if (currentArea) {
      breadcrumbItems.push({
        position: currentPosition,
        name: currentArea.name,
        item: `https://chittordarpan.com/area/${currentArea.slug}`
      })
      currentPosition++
    }

    // Always add category if available
    if (business.category_name) {
      breadcrumbItems.push({
        position: currentPosition,
        name: business.category_name,
        item: `https://chittordarpan.com/businesses?category=${encodeURIComponent(business.category_name)}${currentArea ? `&area=${encodeURIComponent(currentArea.name)}` : ''}`
      })
      currentPosition++
    }

    // Add current business
    breadcrumbItems.push({
      position: currentPosition,
      name: business.name,
      item: `https://chittordarpan.com/business/${business.slug}`
    })

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map(item => ({
        "@type": "ListItem",
        ...item
      }))
    }

    return (
      <>
        {/* Simple Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        
        {/* Preload hero image */}
        {business.cover_image_url && (
          <link
            rel="preload"
            as="image"
            href={business.cover_image_url}
            fetchPriority="high"
          />
        )}
        
        <BusinessListingClient 
          business={business}
          reviewStats={reviewStats}
          relatedBusinesses={relatedBusinesses || []}
          currentArea={currentArea}
          currentCity={currentCity}
        />
      </>
    )
  } catch (error) {
    console.error('Error in BusinessPage:', error)
    notFound()
  }
}