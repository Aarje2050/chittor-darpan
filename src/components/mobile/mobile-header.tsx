'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useMobile, useMobileScroll } from '@/hooks/use-mobile'
import { Button, IconButton } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'

export interface MobileHeaderProps {
  /**
   * Header title
   */
  title?: React.ReactNode
  /**
   * Whether to show the back button
   */
  showBackButton?: boolean
  /**
   * Back button click handler
   */
  onBackClick?: () => void
  /**
   * Whether to show search functionality
   */
  showSearch?: boolean
  /**
   * Search value
   */
  searchValue?: string
  /**
   * Search change handler
   */
  onSearchChange?: (value: string) => void
  /**
   * Search placeholder
   */
  searchPlaceholder?: string
  /**
   * Right side actions
   */
  actions?: React.ReactNode
  /**
   * Whether header should auto-hide on scroll down
   */
  autoHide?: boolean
  /**
   * Additional class names
   */
  className?: string
  /**
   * Whether header should be sticky
   */
  sticky?: boolean
}

/**
 * Mobile-first header component with auto-hide functionality
 * Optimized for one-handed operation and touch interactions
 */
export function MobileHeader({
  title,
  showBackButton = false,
  onBackClick,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  autoHide = true,
  className,
  sticky = true
}: MobileHeaderProps) {
  const { isMobile, isLoading } = useMobile()
  const { scrollDirection, isScrolling } = useMobileScroll()
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false)

  // Auto-hide logic
  const shouldHide = autoHide && 
                    isMobile && 
                    isScrolling && 
                    scrollDirection === 'down' && 
                    !isSearchExpanded

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      // Default behavior - browser back
      window.history.back()
    }
  }

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded)
    if (isSearchExpanded && onSearchChange) {
      onSearchChange('')
    }
  }

  // Don't render during SSR loading
  if (isLoading) {
    return <HeaderSkeleton />
  }

  // Desktop fallback (should be handled by desktop components)
  if (!isMobile) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {actions}
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        // Base styles
        'bg-white border-b border-gray-200 z-40 transition-transform duration-300 ease-in-out',
        // Sticky positioning
        sticky && 'sticky top-0',
        // Auto-hide behavior
        shouldHide ? '-translate-y-full' : 'translate-y-0',
        // Safe area support
        'safe-area-top',
        className
      )}
    >
      {/* Main header content */}
      <div className={cn(
        'flex items-center justify-between px-4 h-14',
        isSearchExpanded && 'hidden'
      )}>
        {/* Left section */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBackButton && (
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
              onClick={handleBackClick}
              aria-label="Go back"
              variant="ghost"
              size="sm"
            />
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showSearch && (
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              onClick={handleSearchToggle}
              aria-label="Search"
              variant="ghost"
              size="sm"
            />
          )}
          
          {actions}
        </div>
      </div>

      {/* Expanded search */}
      {isSearchExpanded && (
        <div className="flex items-center gap-2 px-4 h-14">
          <IconButton
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
            onClick={handleSearchToggle}
            aria-label="Close search"
            variant="ghost"
            size="sm"
          />
          
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              onClear={() => onSearchChange?.('')}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}

/**
 * Business Header variant for business detail pages
 */
export interface BusinessHeaderProps extends Omit<MobileHeaderProps, 'title' | 'actions'> {
  businessName: string
  isVerified?: boolean
  rating?: number
  onShareClick?: () => void
  onFavoriteClick?: () => void
  isFavorited?: boolean
}

export function BusinessHeader({
  businessName,
  isVerified = false,
  rating,
  onShareClick,
  onFavoriteClick,
  isFavorited = false,
  ...headerProps
}: BusinessHeaderProps) {
  return (
    <MobileHeader
      title={
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{businessName}</span>
          {isVerified && (
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4V6H16C17.1 6 18 6.9 18 8V10C19.1 10 20 10.9 20 12C20 13.1 19.1 14 18 14V16C18 17.1 17.1 18 16 18H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V18H8C6.9 18 6 17.1 6 16V14C4.9 14 4 13.1 4 12C4 10.9 4.9 10 6 10V8C6 6.9 6.9 6 8 6H10V4C10 2.9 10.9 2 12 2M15.5 12L10.5 7L9 8.5L13 12.5L15.5 10Z"/>
            </svg>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-1">
          {rating && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
              <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
          
          {onFavoriteClick && (
            <IconButton
              icon={
                <svg 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isFavorited ? "text-red-500 fill-current" : "text-gray-400"
                  )} 
                  fill={isFavorited ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              onClick={onFavoriteClick}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              variant="ghost"
              size="sm"
            />
          )}
          
          {onShareClick && (
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              }
              onClick={onShareClick}
              aria-label="Share business"
              variant="ghost"
              size="sm"
            />
          )}
        </div>
      }
      {...headerProps}
    />
  )
}

/**
 * Header skeleton for loading states
 */
function HeaderSkeleton() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </header>
  )
}

/**
 * Header variants for different page types
 */
export const HeaderVariants = {
  Home: (props: Partial<MobileHeaderProps>) => (
    <MobileHeader
      title="Chittor Darpan"
      showSearch={true}
      autoHide={false}
      {...props}
    />
  ),
  
  Category: (categoryName: string, props?: Partial<MobileHeaderProps>) => (
    <MobileHeader
      title={categoryName}
      showBackButton={true}
      showSearch={true}
      {...props}
    />
  ),
  
  BusinessDetail: (businessProps: BusinessHeaderProps) => (
    <BusinessHeader {...businessProps} />
  ),
  
  Search: (props?: Partial<MobileHeaderProps>) => (
    <MobileHeader
      title="Search"
      showBackButton={true}
      showSearch={true}
      autoHide={false}
      {...props}
    />
  ),
  
  Profile: (props?: Partial<MobileHeaderProps>) => (
    <MobileHeader
      title="Profile"
      showBackButton={true}
      {...props}
    />
  )
}