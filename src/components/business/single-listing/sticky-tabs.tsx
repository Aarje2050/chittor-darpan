// src/components/business/single-listing/sticky-tabs.tsx
'use client'

import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { Eye, Camera, Star, Phone } from 'lucide-react'

interface StickyTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isSticky: boolean
  photosCount?: number
  reviewsCount?: number
}

export default function StickyTabs({ 
  activeTab, 
  onTabChange, 
  isSticky,
  photosCount = 0,
  reviewsCount = 0
}: StickyTabsProps) {
  const { isMobile } = useMobile()
  
  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview',
      icon: Eye
    },
    { 
      id: 'photos', 
      label: 'Photos',
      icon: Camera,
      count: photosCount > 0 ? photosCount : undefined
    },
    { 
      id: 'reviews', 
      label: 'Reviews',
      icon: Star,
      count: reviewsCount > 0 ? reviewsCount : undefined
    },
    { 
      id: 'contact', 
      label: 'Contact',
      icon: Phone
    }
  ]

  return (
    <div className={cn(
      "bg-white border-b border-gray-200 transition-all duration-300",
      isSticky 
        ? cn(
            "fixed left-0 right-0 shadow-md z-30",
            isMobile ? "top-0" : "top-16" // Mobile: no header, Desktop: below header (64px)
          )
        : "relative"
    )}>
      <div className={cn(
        "mx-auto",
        !isMobile && "max-w-6xl px-4" // Desktop: contained width with padding
      )}>
        {/* Horizontally scrollable tabs container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-0",
                    // Mobile: equal width, Desktop: auto width with min-width
                    isMobile ? "flex-1" : "min-w-[120px]",
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-shrink-0">{tab.label}</span>
                  {tab.count && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                      activeTab === tab.id 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}