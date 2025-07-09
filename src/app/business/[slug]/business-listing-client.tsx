// src/app/business/[slug]/business-listing-client.tsx - UPDATED WITH SEPARATE COMPONENTS
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { type Business, type ReviewStats } from '@/lib/database'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import SaveButton from '@/components/ui/save-button'
import { Button } from '@/components/ui/button'
import BusinessReviews from '@/components/reviews/business-reviews'

// Import our separate components
import BusinessHeroSection from '@/components/business/single-listing/business-hero-section'
import BusinessHeaderInfo from '@/components/business/single-listing/business-header-info'
import FloatingActionButtons from '@/components/business/single-listing/floating-action-buttons'
import StickyTabs from '@/components/business/single-listing/sticky-tabs'
import SimpleBreadcrumbs from '@/components/business/single-listing/simple-breadcrumbs'

// Icons
import { 
  Camera, Star, MapPin, Clock, ChevronLeft, ChevronRight, X, Share2,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface BusinessListingClientProps {
  business: Business
  reviewStats: ReviewStats | null
  relatedBusinesses: Business[]
  currentArea?: any
  currentCity?: any
}

// Business Description with Read More Component
function BusinessDescriptionWithReadMore({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div>
      <p className="text-gray-700 leading-relaxed">
        {isExpanded 
          ? description
          : description.length > 150 
            ? `${description.substring(0, 150)}...` 
            : description
        }
      </p>
      {description.length > 150 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 font-medium text-sm mt-2 flex items-center gap-1 hover:text-blue-700 transition-colors"
        >
          {isExpanded ? (
            <>
              Show less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

// Image Modal Component
function ImageModal({ 
  images, 
  businessName, 
  currentIndex,
  onClose,
  onIndexChange
}: { 
  images: string[]
  businessName: string
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="absolute top-4 left-4 text-white z-10">
        {currentIndex + 1} / {images.length}
      </div>

      <Image 
        src={images[currentIndex]} 
        alt={`${businessName} - Photo ${currentIndex + 1}`}
        width={1200}
        height={800}
        className="max-w-full max-h-full object-contain"
      />

      {images.length > 1 && (
        <>
          <button 
            onClick={() => onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  )
}

export default function BusinessListingClient({
  business,
  reviewStats,
  relatedBusinesses,
  currentArea,
  currentCity
}: BusinessListingClientProps) {
  // Debug: Check category_name
  useEffect(() => {
    console.log('🔍 Business Debug Info:', {
      businessName: business.name,
      categoryName: business.category_name,
      categoryId: business.category_id,
      cityName: business.city_name,
      areaName: business.area_name
    })
    
    if (!business.category_name) {
      console.log('🚨 CATEGORY MISSING: Check your businessService.getBusinesses() query')
      console.log('   You need to JOIN through business_categories table:')
      console.log('   businesses -> business_categories -> categories')
    }
  }, [business])

  const { isMobile } = useMobile()
  const [activeTab, setActiveTab] = useState('overview')
  const [isTabsSticky, setIsTabsSticky] = useState(false)
  const [showFloatingActions, setShowFloatingActions] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  
  // Refs for scroll detection
  const businessInfoRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLDivElement>(null)
  const photosRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  
  // Get real business images
  const businessImages = [
    business.cover_image_url,
    ...((business.gallery_images as string[]) || [])
  ].filter((image): image is string => Boolean(image))

  // Get real business hours and status
  const businessHours = business.business_hours || []
  const isCurrentlyOpen = business.is_open || false

  // Scroll handler for sticky tabs and floating actions
  useEffect(() => {
    const handleScroll = () => {
      if (!businessInfoRef.current) return
      
      const businessInfoBottom = businessInfoRef.current.getBoundingClientRect().bottom
      const headerHeight = isMobile ? 0 : 64 // Desktop header height
      
      // Tabs become sticky when business info section goes above viewport
      setIsTabsSticky(businessInfoBottom <= headerHeight)
      
      // Floating actions appear when business info is scrolled past
      setShowFloatingActions(businessInfoBottom <= headerHeight - 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile])

  // Tab navigation with smooth scrolling
  const scrollToSection = (tabId: string) => {
    setActiveTab(tabId)
    
    const refs = {
      overview: overviewRef,
      photos: photosRef,
      reviews: reviewsRef,
      contact: contactRef
    }
    
    const targetRef = refs[tabId as keyof typeof refs]
    if (targetRef?.current) {
      const headerOffset = isTabsSticky ? (isMobile ? 60 : 124) : 0 // Account for sticky tabs + header
      const elementPosition = targetRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Handle rating click to scroll to reviews
  const handleRatingClick = () => {
    scrollToSection('reviews')
  }

  // Handle image modal
  const handleOpenModal = (index: number) => {
    setModalIndex(index)
    setIsModalOpen(true)
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      // Add bottom padding when floating actions are visible (72px floating + 16px buffer = 88px)
      showFloatingActions && isMobile ? "pb-[88px]" : "pb-20"
    )}>
      {/* Mobile Header */}
      {isMobile && <MobileHeader title={business.name} showBackButton />}

      {/* Breadcrumbs - Show on both mobile and desktop with proper width */}
      <div className={cn(
        isMobile ? "w-full" : "max-w-6xl mx-auto px-4"
      )}>
        <SimpleBreadcrumbs business={business} currentArea={currentArea} />
      </div>

      {/* Main Container - Desktop: Constrained width */}
      <div className={cn(
        isMobile ? "w-full" : "max-w-6xl mx-auto px-4"
      )}>
        
        {/* Hero Section */}
        <BusinessHeroSection 
          business={business} 
          images={businessImages}
          onOpenModal={handleOpenModal}
        />

        {/* Business Header Info */}
        <div ref={businessInfoRef}>
          <BusinessHeaderInfo 
            business={business} 
            reviewStats={reviewStats} 
            isCurrentlyOpen={isCurrentlyOpen}
            onRatingClick={handleRatingClick}
          />
        </div>

        {/* Sticky Tabs */}
        <StickyTabs 
          activeTab={activeTab}
          onTabChange={scrollToSection}
          isSticky={isTabsSticky}
          photosCount={businessImages.length}
          reviewsCount={reviewStats?.totalReviews || 0}
        />

        {/* Content Sections */}
        <div className={cn(
          "bg-white",
          isTabsSticky && "mt-16" // Space for sticky tabs
        )}>
          
          {/* Overview Section */}
          <div ref={overviewRef} className="px-4 py-6">
            <h2 className="text-lg font-bold mb-4">About</h2>
            {business.description ? (
              <BusinessDescriptionWithReadMore description={business.description} />
            ) : (
              <p className="text-gray-500 italic">No description available.</p>
            )}
          </div>

          {/* Photos Section */}
          <div ref={photosRef} className="px-4 py-6 border-t border-gray-100">
            <h2 className="text-lg font-bold mb-4">Photos ({businessImages.length})</h2>
            {businessImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {businessImages.slice(0, 6).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleOpenModal(index)}
                    className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <Image 
                      src={image} 
                      alt={`${business.name} photo ${index + 1}`}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No photos available</p>
              </div>
            )}
          </div>

          {/* Contact/Hours Section */}
          <div ref={contactRef} className="px-4 py-6 border-t border-gray-100">
            <h2 className="text-lg font-bold mb-4">Hours</h2>
            {businessHours.length > 0 ? (
              <div className="space-y-3">
                {businessHours.map((hour, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {hour.day}
                      {hour.isToday && (
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Today
                        </span>
                      )}
                    </span>
                    <span className={cn(
                      "font-medium",
                      hour.time === 'Closed' ? 'text-red-600' : 'text-gray-900'
                    )}>
                      {hour.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Business hours not available. Please call for details.</p>
            )}
          </div>

          {/* Reviews Section */}
          <div ref={reviewsRef} className="border-t border-gray-100">
            <BusinessReviews 
              businessId={business.id}
              businessName={business.name}
              showAddReview={true}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Mobile (appear when header is scrolled past) */}
      {isMobile && (
        <FloatingActionButtons 
          business={business}
          isVisible={showFloatingActions}
        />
      )}

      {/* Desktop: Fixed Share & Save Buttons */}
      {!isMobile && (
        <div className="fixed bottom-6 right-6 flex gap-3 z-50">
          <SaveButton
            entityType="business"
            entityId={business.id}
            entityName={business.name}
            variant="text"
            className="shadow-lg"
          />
          <Button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="shadow-lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      )}

      {/* Image Modal */}
      {isModalOpen && businessImages.length > 0 && (
        <ImageModal 
          images={businessImages}
          businessName={business.name}
          currentIndex={modalIndex}
          onClose={() => setIsModalOpen(false)}
          onIndexChange={setModalIndex}
        />
      )}
    </div>
  )
}