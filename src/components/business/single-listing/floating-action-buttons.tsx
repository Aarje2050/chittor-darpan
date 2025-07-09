// src/components/business/single-listing/floating-action-buttons.tsx
'use client'

import { type Business } from '@/lib/database'
import { cn, formatPhoneNumber, getWhatsAppUrl, getDirectionsUrl } from '@/lib/utils'
import { Phone, MessageCircle, Navigation, Share2 } from 'lucide-react'

interface FloatingActionButtonsProps {
  business: Business
  isVisible: boolean
}

export default function FloatingActionButtons({ business, isVisible }: FloatingActionButtonsProps) {
  // Action handlers
  const handleCall = () => {
    if (business.phone?.[0]) {
      window.location.href = formatPhoneNumber(business.phone[0]).href
    }
  }

  const handleMessage = () => {
    if (business.whatsapp) {
      const url = getWhatsAppUrl(business.whatsapp, `Hi! I found your business "${business.name}" on Chittor Darpan.`)
      window.open(url, '_blank')
    } else if (business.phone?.[0]) {
      window.location.href = `sms:${business.phone[0]}`
    }
  }

  const handleDirections = () => {
    const url = getDirectionsUrl(business.address, business.name)
    window.open(url, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: `Check out ${business.name} on Chittor Darpan`,
          url: window.location.href
        })
      } catch (error) {
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className={cn(
      "fixed left-4 right-4 transition-all duration-300 z-[60]",
      // Increased bottom spacing to avoid overlapping with bottom nav (64px + 8px = 72px)
      isVisible ? "bottom-[72px]" : "bottom-[-150px]"
    )}>
      {/* Floating action container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
        <div className="grid grid-cols-4 gap-2">
          
          {/* Call Button */}
          {business.phone?.[0] && (
            <button
              onClick={handleCall}
              className="flex flex-col items-center justify-center py-3 px-2 rounded-xl hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors shadow-md">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-900">Call</span>
            </button>
          )}

          {/* Message Button */}
          {(business.whatsapp || business.phone?.[0]) && (
            <button
              onClick={handleMessage}
              className="flex flex-col items-center justify-center py-3 px-2 rounded-xl hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors shadow-md">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-900">Message</span>
            </button>
          )}

          {/* Directions Button */}
          <button
            onClick={handleDirections}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors shadow-md">
              <Navigation className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-900">Directions</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors shadow-md">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-900">Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}