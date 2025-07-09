// src/app/page.tsx
import type { Metadata } from 'next'
import HomePageContent from '@/components/homepage/homepage-content'

export const metadata: Metadata = {
  title: 'Chittor Darpan - Chittorgarh Business Directory | Local Search Engine | City Website',
  description: 'Complete local search engine for Chittorgarh city. Find businesses, restaurants, hotels, services, jobs, events, and tourist attractions in Chittorgarh, Rajasthan. Your trusted Chittorgarh website and business directory.',
  keywords: [
    // Primary Keywords
    'chittorgarh business directory',
    'chittor darpan',
    'chittorgarh website',
    'city website of chittorgarh',
    'local search engine chittorgarh',
    
    // Business Related
    'find businesses chittorgarh',
    'chittorgarh restaurants',
    'chittorgarh hotels',
    'chittorgarh shops',
    'chittorgarh services',
    'local businesses chittorgarh',
    
    // Location Based
    'chittorgarh local directory',
    'chittorgarh city guide',
    'businesses in chittorgarh',
    'chittorgarh rajasthan',
    
    // Content Categories
    'chittorgarh news',
    'chittorgarh events',
    'chittorgarh jobs',
    'chittorgarh tourism',
    'chittorgarh fort',
    
    // Service Keywords
    'chittorgarh healthcare',
    'chittorgarh education',
    'chittorgarh shopping',
    'chittorgarh automotive',
    'professional services chittorgarh'
  ],
  authors: [{ name: 'Chittor Darpan Team', url: 'https://chittordarpan.com' }],
  creator: 'Chittor Darpan',
  publisher: 'Chittor Darpan',
  
  // Canonical URL
  alternates: {
    canonical: 'https://chittordarpan.com',
  },
  
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://chittordarpan.com',
    siteName: 'Chittor Darpan',
    title: 'Chittor Darpan - Complete Chittorgarh Business Directory & Local Search Engine',
    description: 'Find everything in Chittorgarh - businesses, restaurants, hotels, tourist attractions, jobs, events, and local services. Your complete guide to Chittorgarh city.',
    images: [
      {
        url: '/og-image-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'Chittor Darpan - Chittorgarh Business Directory and Local Search Engine',
        type: 'image/jpeg',
      },
      {
        url: '/og-image-chittorgarh-fort.jpg',
        width: 1200,
        height: 630,
        alt: 'Chittorgarh Fort - Historic Attraction in Chittorgarh',
        type: 'image/jpeg',
      }
    ]
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@chittordarpan',
    creator: '@chittordarpan',
    title: 'Chittor Darpan - Chittorgarh Business Directory & Local Search Engine',
    description: 'Complete local search engine for Chittorgarh. Find businesses, restaurants, hotels, services, and attractions in the historic city of Rajasthan.',
    images: ['/og-image-homepage.jpg']
  },
  
  // Additional SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  
  // Geo location for local SEO
  other: {
    'geo.region': 'IN-RJ',
    'geo.placename': 'Chittorgarh',
    'geo.position': '24.8887;74.6269',
    'ICBM': '24.8887, 74.6269',
    'language': 'en-IN',
    'coverage': 'Worldwide',
    'distribution': 'Global',
    'rating': 'General',
    'revisit-after': '1 days',
    'target': 'all',
    'audience': 'all',
    'resource-type': 'document',
    'classification': 'business directory'
  },
  
  // Verification tags (replace with actual codes)
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    other: {
      'msvalidate.01': 'your-bing-verification-code',
      'pinterest-site-verification': 'your-pinterest-verification-code'
    }
  },
  
  // App Links (for future mobile app)
  appLinks: {
    web: {
      url: 'https://chittordarpan.com',
      should_fallback: true
    }
  }
}

// Enhanced Schema.org structured data for better SEO
const schemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://chittordarpan.com/#website",
      "url": "https://chittordarpan.com",
      "name": "Chittor Darpan",
      "alternateName": "Chittorgarh Business Directory",
      "description": "Complete local search engine and business directory for Chittorgarh city, Rajasthan",
      "publisher": {
        "@id": "https://chittordarpan.com/#organization"
      },
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://chittordarpan.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      ],
      "inLanguage": "en-IN"
    },
    {
      "@type": "Organization",
      "@id": "https://chittordarpan.com/#organization",
      "name": "Chittor Darpan",
      "alternateName": "Chittorgarh Business Directory",
      "url": "https://chittordarpan.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chittordarpan.com/logo.png",
        "width": 512,
        "height": 512
      },
      "image": "https://chittordarpan.com/og-image.jpg",
      "description": "Chittor Darpan is the complete local search engine and business directory for Chittorgarh, connecting residents and visitors with businesses, services, and attractions.",
      "email": "info@chittordarpan.com",
      "telephone": "+91-9876543210",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Near Chittorgarh Fort",
        "addressLocality": "Chittorgarh",
        "addressRegion": "Rajasthan",
        "postalCode": "312001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 24.8887,
        "longitude": 74.6269
      },
      "areaServed": {
        "@type": "City",
        "name": "Chittorgarh",
        "containedInPlace": {
          "@type": "State",
          "name": "Rajasthan",
          "containedInPlace": {
            "@type": "Country",
            "name": "India"
          }
        }
      },
      "foundingDate": "2024",
      "numberOfEmployees": "10-50",
      "slogan": "Your Complete Guide to Chittorgarh",
      "knowsAbout": [
        "Chittorgarh Business Directory",
        "Local Business Listings",
        "Tourism Information",
        "Restaurant Reviews",
        "Hotel Bookings",
        "Professional Services",
        "Healthcare Providers",
        "Educational Institutions",
        "Shopping Centers",
        "Event Listings",
        "Job Opportunities"
      ],
      "serviceArea": {
        "@type": "City",
        "name": "Chittorgarh"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "500",
        "bestRating": "5",
        "worstRating": "1"
      },
      "sameAs": [
        "https://facebook.com/chittordarpan",
        "https://twitter.com/chittordarpan",
        "https://instagram.com/chittordarpan",
        "https://linkedin.com/company/chittordarpan"
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://chittordarpan.com/#webpage",
      "url": "https://chittordarpan.com",
      "name": "Chittor Darpan - Chittorgarh Business Directory",
      "isPartOf": {
        "@id": "https://chittordarpan.com/#website"
      },
      "about": {
        "@id": "https://chittordarpan.com/#organization"
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://chittordarpan.com/og-image-homepage.jpg",
        "width": 1200,
        "height": 630
      },
      "datePublished": "2024-01-01T00:00:00+05:30",
      "dateModified": "2024-01-15T00:00:00+05:30",
      "description": "Complete local search engine for Chittorgarh city. Find businesses, restaurants, hotels, services, and attractions in Chittorgarh, Rajasthan.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://chittordarpan.com"
          }
        ]
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "xpath": [
          "/html/head/title",
          "/html/head/meta[@name='description']/@content"
        ]
      },
      "inLanguage": "en-IN"
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://chittordarpan.com/#localbusiness",
      "name": "Chittor Darpan Directory Service",
      "description": "Local business directory and search engine service for Chittorgarh city",
      "url": "https://chittordarpan.com",
      "telephone": "+91-9876543210",
      "email": "info@chittordarpan.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Chittorgarh",
        "addressRegion": "Rajasthan",
        "addressCountry": "IN",
        "postalCode": "312001"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 24.8887,
        "longitude": 74.6269
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday", 
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      },
      "serviceType": "Business Directory Service",
      "areaServed": "Chittorgarh"
    }
  ]
}

export default function HomePage() {
  return (
    <>
      {/* Enhanced Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      {/* Homepage content */}
      <HomePageContent />
    </>
  )
}