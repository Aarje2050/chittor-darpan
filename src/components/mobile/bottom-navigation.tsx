'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMobile, useMobileScroll } from '@/hooks/use-mobile'
import { NotificationBadge } from '@/components/ui/badge'

export interface NavigationItem {
  /**
   * Unique identifier for the navigation item
   */
  id: string
  /**
   * Display label
   */
  label: string
  /**
   * Navigation path
   */
  href: string
  /**
   * Icon component (24x24px recommended)
   */
  icon: React.ReactNode
  /**
   * Active state icon (optional, defaults to same as icon)
   */
  activeIcon?: React.ReactNode
  /**
   * Notification count (optional)
   */
  notificationCount?: number
  /**
   * Whether item is disabled
   */
  disabled?: boolean
  /**
   * Click handler (optional, for custom behavior)
   */
  onClick?: () => void
  /**
   * Whether to match exact path or include sub-paths
   */
  exactMatch?: boolean
}

export interface BottomNavigationProps {
  /**
   * Navigation items
   */
  items: NavigationItem[]
  /**
   * Whether navigation should auto-hide on scroll down
   */
  autoHide?: boolean
  /**
   * Additional class names
   */
  className?: string
  /**
   * Whether to show labels under icons
   */
  showLabels?: boolean
  /**
   * Active item override (for custom logic)
   */
  activeItem?: string
}

/**
 * Mobile-first bottom navigation component
 * Follows iOS and Android design guidelines for tab navigation
 */
export function BottomNavigation({
  items,
  autoHide = true,
  className,
  showLabels = true,
  activeItem
}: BottomNavigationProps) {
  const pathname = usePathname()
  const { isMobile, isLoading } = useMobile()
  const { scrollDirection, isScrolling } = useMobileScroll()

  // Auto-hide logic
  const shouldHide = autoHide && 
                    isMobile && 
                    isScrolling && 
                    scrollDirection === 'down'

  // Determine active item
  const getActiveItem = () => {
    if (activeItem) return activeItem
    
    return items.find(item => {
      if (item.exactMatch) {
        return pathname === item.href
      }
      return pathname.startsWith(item.href)
    })?.id || items[0]?.id
  }

  const activeItemId = getActiveItem()

  // Don't render during SSR loading
  if (isLoading) {
    return <NavigationSkeleton />
  }

  // Don't render on desktop (desktop should use different navigation)
  if (!isMobile) {
    return null
  }

  return (
    <nav
      className={cn(
        // Base styles
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200',
        // Auto-hide behavior
        'transition-transform duration-300 ease-in-out',
        shouldHide ? 'translate-y-full' : 'translate-y-0',
        // Safe area support for iOS
        'safe-area-bottom',
        className
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            showLabel={showLabels}
          />
        ))}
      </div>
    </nav>
  )
}

/**
 * Individual navigation item component
 */
interface NavigationItemProps {
  item: NavigationItem
  isActive: boolean
  showLabel: boolean
}

function NavigationItem({ item, isActive, showLabel }: NavigationItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault()
      return
    }
    
    if (item.onClick) {
      e.preventDefault()
      item.onClick()
    }
  }

  const content = (
    <div
      className={cn(
        // Base styles
        'relative flex flex-col items-center justify-center h-full transition-all duration-200',
        // Touch target optimization
        'touch-manipulation select-none',
        // Active/inactive states
        isActive 
          ? 'text-black' 
          : 'text-gray-500 hover:text-gray-700 active:text-gray-900',
        // Disabled state
        item.disabled && 'opacity-50 cursor-not-allowed'
      )}
      role="tab"
      aria-selected={isActive}
      aria-label={item.label}
    >
      {/* Icon with notification badge */}
      <div className="relative">
        <div className={cn(
          'flex items-center justify-center w-6 h-6 transition-transform duration-200',
          isActive && 'scale-110'
        )}>
          {isActive && item.activeIcon ? item.activeIcon : item.icon}
        </div>
        
        {item.notificationCount && item.notificationCount > 0 && (
          <NotificationBadge
            count={item.notificationCount}
            position="top-right"
            max={99}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={cn(
          'text-xs font-medium mt-1 transition-all duration-200',
          // Truncate long labels
          'truncate max-w-full px-1',
          // Active state styling
          isActive && 'scale-105'
        )}>
          {item.label}
        </span>
      )}

      {/* Active indicator dot */}
      {isActive && !showLabel && (
        <div className="absolute bottom-1 w-1 h-1 bg-current rounded-full" />
      )}
    </div>
  )

  // Render as Link or button based on whether onClick is provided
  if (item.onClick || item.disabled) {
    return (
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
      >
        {content}
      </button>
    )
  }

  return (
    <Link 
      href={item.href}
      className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
      onClick={handleClick}
    >
      {content}
    </Link>
  )
}

/**
 * Navigation skeleton for loading states
 */
function NavigationSkeleton() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center justify-center h-full">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="w-8 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </nav>
  )
}

/**
 * Hook for managing bottom navigation state
 */
export function useBottomNavigation() {
  const [counts, setCounts] = React.useState<Record<string, number>>({})

  const updateNotificationCount = React.useCallback((itemId: string, count: number) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: count
    }))
  }, [])

  const clearNotification = React.useCallback((itemId: string) => {
    setCounts(prev => {
      const newCounts = { ...prev }
      delete newCounts[itemId]
      return newCounts
    })
  }, [])

  return {
    notificationCounts: counts,
    updateNotificationCount,
    clearNotification
  }
}