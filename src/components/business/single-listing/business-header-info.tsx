// src/components/business/single-listing/business-header-info.tsx - FIXED with Real Message Button
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type Business, type ReviewStats } from '@/lib/database'
import { cn, formatPhoneNumber, getWhatsAppUrl, getDirectionsUrl } from '@/lib/utils'
import { Star, Phone, MessageCircle, Navigation, Globe } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useCreateConversation } from '@/hooks/use-messaging'

interface BusinessHeaderInfoProps {
  business: Business
  reviewStats: ReviewStats | null 
  isCurrentlyOpen: boolean
  onRatingClick: () => void
}

export default function BusinessHeaderInfo({ 
  business, 
  reviewStats, 
  isCurrentlyOpen,
  onRatingClick 
}: BusinessHeaderInfoProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { createConversation, loading: messageLoading } = useCreateConversation()
  const [showMessageOptions, setShowMessageOptions] = useState(false)

  // Debug: Check category in header component
  useEffect(() => {
    console.log('🏢 BusinessHeaderInfo - Category Debug:', {
      businessName: business.name,
      categoryName: business.category_name,
      categoryId: business.category_id
    })
  }, [business])

  // Get gallery images for thumbnail row
  const galleryImages = (business.gallery_images as string[]) || []
  
  // Action handlers
  const handleCall = () => {
    if (business.phone?.[0]) {
      window.location.href = formatPhoneNumber(business.phone[0]).href
    }
  }

  // NEW: Real message handler using our messaging system
  const handleMessage = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    // If user is the business owner, don't allow messaging themselves
    if (user.id === business.owner_id) {
      alert('You cannot message your own business')
      return
    }

    // Show options if business has both WhatsApp and our messaging
    if (business.whatsapp) {
      setShowMessageOptions(true)
      return
    }

    // Use our messaging system
    await startDirectMessage()
  }

  const startDirectMessage = async () => {
    if (!user || !business.owner_id) return

    try {
      const result = await createConversation(
        business.owner_id,
        business.id,
        `Hi! I'm interested in ${business.name}. Can you please provide more information?`
      )

      if (result.success && result.conversationId) {
        router.push(`/messages?conversation=${result.conversationId}`)
      } else {
        console.error('Failed to create conversation:', result.error)
        alert('Failed to start conversation. Please try again.')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  const handleWhatsAppMessage = () => {
    if (business.whatsapp) {
      const url = getWhatsAppUrl(business.whatsapp, `Hi! I found your business "${business.name}" on Chittor Darpan.`)
      window.open(url, '_blank')
    }
    setShowMessageOptions(false)
  }

  const handleDirections = () => {
    const url = getDirectionsUrl(business.address, business.name)
    window.open(url, '_blank')
  }

  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http') ? business.website : `https://${business.website}`
      window.open(url, '_blank')
    }
  }
  
  return (
    <div className="bg-white px-4 py-6">
      {/* Business name and verification */}
      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{business.name}</h1>
        {business.is_verified && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
            ✓ Verified
          </span>
        )}
      </div>

      {/* Location */}
      <p className="text-gray-600 mb-3">
        {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
      </p>

      {/* Rating and status */}
      <div className="flex items-center gap-4 mb-4">
        {/* Clickable Rating */}
        <button 
          onClick={onRatingClick}
          className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
        >
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={cn(
                  "w-5 h-5",
                  reviewStats && star <= Math.round(reviewStats.averageRating) 
                    ? 'text-amber-400 fill-current' 
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="font-semibold text-lg">
            {reviewStats ? reviewStats.averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-gray-600">
            ({reviewStats?.totalReviews || 0} review{reviewStats?.totalReviews !== 1 ? 's' : ''})
          </span>
        </button>

        {/* Status */}
        <div className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
          isCurrentlyOpen ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
        )}>
          <div className={cn("w-2 h-2 rounded-full", isCurrentlyOpen ? "bg-green-500" : "bg-red-500")} />
          {isCurrentlyOpen ? 'Open now' : 'Closed'}
        </div>
      </div>

      {/* Category */}
      <p className="text-gray-700 font-medium mb-4">
        {business.category_name || 'Business'}
        {!business.category_name && (
          <span className="text-xs text-gray-500 ml-2">(Category not set)</span>
        )}
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* Call Button */}
        {business.phone?.[0] && (
          <button
            onClick={handleCall}
            className="flex flex-col items-center justify-center py-3 px-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Phone className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Call</span>
          </button>
        )}

        {/* Message Button - UPDATED */}
        <div className="relative">
          <button
            onClick={handleMessage}
            disabled={messageLoading || (user && user.id === business.owner_id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors w-full",
              messageLoading ? 
                "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed" :
                (user && user.id === business.owner_id) ?
                "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed" :
                "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            )}
          >
            {messageLoading ? (
              <div className="w-5 h-5 mb-1 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
            ) : (
              <MessageCircle className="w-5 h-5 mb-1" />
            )}
            <span className="text-xs font-medium">
              {messageLoading ? 'Loading...' : 'Message'}
            </span>
          </button>

          {/* Message Options Dropdown */}
          {showMessageOptions && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={startDirectMessage}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg"
              >
                <div className="font-medium text-gray-900">Send Direct Message</div>
                <div className="text-sm text-gray-500">Message through Chittor Darpan</div>
              </button>
              <button
                onClick={handleWhatsAppMessage}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg border-t"
              >
                <div className="font-medium text-gray-900">WhatsApp</div>
                <div className="text-sm text-gray-500">Message on WhatsApp</div>
              </button>
              <button
                onClick={() => setShowMessageOptions(false)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Directions Button */}
        <button
          onClick={handleDirections}
          className="flex flex-col items-center justify-center py-3 px-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Navigation className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Directions</span>
        </button>

        {/* Website Button */}
        {business.website ? (
          <button
            onClick={handleWebsite}
            className="flex flex-col items-center justify-center py-3 px-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Website</span>
          </button>
        ) : (
          <button
            disabled
            className="flex flex-col items-center justify-center py-3 px-2 bg-white border-2 border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
          >
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Website</span>
          </button>
        )}
      </div>

      {/* Login prompt for non-authenticated users */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <button 
              onClick={() => router.push('/login')}
              className="underline font-medium"
            >
              Login
            </button> to message this business directly
          </p>
        </div>
      )}

      {/* Small thumbnail row */}
      {galleryImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {galleryImages.slice(0, 5).map((image, index) => (
            <div key={index} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image 
                src={image} 
                alt={`${business.name} photo ${index + 1}`}
                width={48}
                height={48}
                className="w-full h-full object-cover" 
              />
            </div>
          ))}
          {galleryImages.length > 5 && (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">+{galleryImages.length - 5}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}