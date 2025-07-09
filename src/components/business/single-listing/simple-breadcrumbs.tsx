// src/components/business/single-listing/simple-breadcrumbs.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { type Business } from '@/lib/database'
import { ChevronRight, Home } from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'

interface SimpleBreadcrumbsProps {
  business: Business
  currentArea?: any
  className?: string
}

export default function SimpleBreadcrumbs({ business, currentArea, className }: SimpleBreadcrumbsProps) {
  const { isMobile } = useMobile()
  
  // Debug: Check if category is available
  useEffect(() => {
    if (!business.category_name) {
      console.warn('🚨 Breadcrumbs: Missing category_name for business:', business.name)
      console.log('Business data in breadcrumbs:', { 
        name: business.name,
        category_name: business.category_name,
        category_id: business.category_id 
      })
    }
  }, [business])
  
  // For mobile, show compact version with area and category
  if (isMobile) {
    return (
      <nav className={`flex items-center space-x-2 text-xs text-gray-500 px-4 py-2 bg-gray-50 ${className || ''}`} aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        {currentArea && (
          <>
            <Link 
              href={`/area/${currentArea.slug}`}
              className="hover:text-blue-600 transition-colors truncate"
            >
              {currentArea.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        {business.category_name ? (
          <>
            <Link 
              href={`/businesses?category=${encodeURIComponent(business.category_name)}`}
              className="hover:text-blue-600 transition-colors truncate"
            >
              {business.category_name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        ) : (
          <>
            <Link 
              href="/businesses"
              className="hover:text-blue-600 transition-colors truncate"
            >
              Businesses
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-gray-700 font-medium truncate">
          {business.name}
        </span>
      </nav>
    )
  }
  
  // Desktop version with proper breadcrumb structure
  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className || ''}`} aria-label="Breadcrumb">
      <Link href="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      
      <ChevronRight className="w-4 h-4 text-gray-400" />
      
      {/* Show area if available */}
      {currentArea ? (
        <>
          <Link 
            href={`/area/${currentArea.slug}`} 
            className="hover:text-blue-600 transition-colors"
          >
            {currentArea.name}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      ) : null}
      
      {/* Show category if available, fallback to "Businesses" */}
      {business.category_name ? (
        <>
          <Link 
            href={`/businesses?category=${encodeURIComponent(business.category_name)}${currentArea ? `&area=${encodeURIComponent(currentArea.name)}` : ''}`}
            className="hover:text-blue-600 transition-colors"
          >
            {business.category_name}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      ) : (
        <>
          <Link 
            href="/businesses"
            className="hover:text-blue-600 transition-colors"
          >
            Businesses
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      )}
      
      <span className="text-gray-900 font-medium truncate max-w-xs">
        {business.name}
      </span>
    </nav>
  )
}