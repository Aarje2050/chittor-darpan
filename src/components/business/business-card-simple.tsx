// src/components/business/business-card-simple.tsx - Clean Minimal Design
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Heart, Share2, Verified } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Business } from '@/lib/database'

interface BusinessCardSimpleProps {
  business: Business
  className?: string
}

export default function BusinessCardSimple({ 
  business, 
  className = ''
}: BusinessCardSimpleProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Get the best available image with proper fallbacks
  const getBusinessImage = () => {
    if (!imageError && business.cover_image_url) {
      return business.cover_image_url
    }
    
    if (!imageError && business.logo_url) {
      return business.logo_url
    }
    
    if (!imageError && business.gallery_images && business.gallery_images.length > 0) {
      return business.gallery_images[0]
    }
    
    // Simple category-based placeholders
    const categoryPlaceholders: Record<string, string> = {
      'restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80',
      'hotels': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
      'shopping': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&q=80',
      'healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop&q=80',
      'services': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop&q=80',
      'education': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&q=80',
      'automotive': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop&q=80',
      'beauty': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&q=80',
      'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&q=80'
    }
    
    return categoryPlaceholders[business.category_slug || 'services'] || 
           'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&q=80'
  }

  // Handle card click to business detail page
  const handleCardClick = () => {
    router.push(`/business/${business.slug}`)
  }

  // Handle action button clicks (prevent card click)
  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    
    switch (action) {
      case 'save':
        setSaved(!saved)
        // TODO: Implement collections save functionality
        console.log('Save business:', business.name)
        break
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: business.name,
            text: `Check out ${business.name} on Chittor Darpan`,
            url: `${window.location.origin}/business/${business.slug}`
          })
        } else {
          navigator.clipboard.writeText(`${window.location.origin}/business/${business.slug}`)
          // TODO: Show toast notification
        }
        break
    }
  }

  // Get business status (open/closed)
  const getStatusInfo = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()
    
    // Check if business is 24 hours
    if (business.is_24_hours) {
      return { status: 'open', text: 'Open', isOpen: true }
    }
    
    // Check business hours if available
    if (business.business_hours && business.business_hours.length > 0) {
      const todayHours = business.business_hours.find(h => h.day_of_week === currentDay)
      
      if (todayHours) {
        if (todayHours.is_closed) {
          return { status: 'closed', text: 'Closed', isOpen: false }
        }
        
        if (todayHours.opens_at && todayHours.closes_at) {
          const opensHour = parseInt(todayHours.opens_at.split(':')[0])
          const closesHour = parseInt(todayHours.closes_at.split(':')[0])
          
          if (currentHour >= opensHour && currentHour < closesHour) {
            return { status: 'open', text: 'Open', isOpen: true }
          } else {
            return { status: 'closed', text: 'Closed', isOpen: false }
          }
        }
      }
    }
    
    // Fallback: assume standard business hours
    const isBusinessHours = currentHour >= 9 && currentHour < 18
    return { 
      status: isBusinessHours ? 'open' : 'closed', 
      text: isBusinessHours ? 'Open' : 'Closed',
      isOpen: isBusinessHours
    }
  }

  // Render star rating
  const renderStarRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="w-4 h-4 relative">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        )
      }
    }
    
    return <div className="flex items-center gap-0.5">{stars}</div>
  }

  const statusInfo = getStatusInfo()
  const hasRating = business.average_rating && business.average_rating > 0
  const reviewCount = business.total_reviews || 0

  return (
    <Card 
      className={cn(
        'overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white border border-gray-200',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={getBusinessImage()}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
          />
          
          {/* Save and Share Icons - Top Right */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm backdrop-blur-sm"
              onClick={(e) => handleActionClick(e, 'save')}
              aria-label={saved ? 'Remove from saved' : 'Save business'}
            >
              <Heart className={cn('h-4 w-4', saved && 'fill-red-500 text-red-500')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm backdrop-blur-sm"
              onClick={(e) => handleActionClick(e, 'share')}
              aria-label="Share business"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Open/Closed Status - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <div className={cn(
              'px-2 py-1 rounded text-xs font-medium bg-white/95 backdrop-blur-sm shadow-sm',
              statusInfo.isOpen ? 'text-green-700' : 'text-red-700'
            )}>
              {statusInfo.text}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Category */}
          {business.category_name && (
            <p className="text-sm text-gray-600 capitalize">
              {business.category_name}
            </p>
          )}

          {/* Business Name with Verification */}
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight flex-1">
              {business.name}
            </h3>
            {business.is_verified && (
              <Verified className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-2">
            {hasRating ? (
              <>
                {renderStarRating(business.average_rating ?? 0)}
                <span className="text-sm font-medium text-gray-900">
                  {(business.average_rating ?? 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {renderStarRating(0)}
                <span>No reviews yet</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple Skeleton component
export function BusinessCardSimpleSkeleton() {
  return (
    <Card className="overflow-hidden bg-white border border-gray-200">
      <CardContent className="p-0">
        {/* Image skeleton */}
        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}