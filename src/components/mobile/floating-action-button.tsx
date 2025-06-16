'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useMobile, useMobileScroll } from '@/hooks/use-mobile'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  /**
   * Position of the FAB
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /**
   * Whether FAB should auto-hide on scroll down
   */
  autoHide?: boolean
  /**
   * Extended state (shows text alongside icon)
   */
  extended?: boolean
  /**
   * Icon for the FAB
   */
  icon?: React.ReactNode
  /**
   * Text for extended FAB
   */
  text?: string
  /**
   * Size variant
   */
  size?: 'default' | 'small' | 'large'
  /**
   * Color variant
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

/**
 * Floating Action Button component optimized for mobile
 * Follows Material Design guidelines for mobile interactions
 */
export function FloatingActionButton({
  position = 'bottom-right',
  autoHide = true,
  extended = false,
  icon,
  text,
  size = 'default',
  variant = 'primary',
  className,
  children,
  ...props
}: FABProps) {
  const { isMobile, isLoading } = useMobile()
  const { scrollDirection, isScrolling } = useMobileScroll()
  const [isExtended, setIsExtended] = React.useState(extended)

  // Auto-hide logic
  const shouldHide = autoHide && 
                    isMobile && 
                    isScrolling && 
                    scrollDirection === 'down'

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  // Size classes
  const sizeClasses = {
    small: 'h-12 w-12',
    default: 'h-14 w-14',
    large: 'h-16 w-16'
  }

  // Extended size classes
  const extendedSizeClasses = {
    small: 'h-12 px-4',
    default: 'h-14 px-6',
    large: 'h-16 px-8'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-lg hover:shadow-xl',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
  }

  // Auto-extend on hover for desktop
  const handleMouseEnter = () => {
    if (!isMobile && extended) {
      setIsExtended(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile && extended) {
      setIsExtended(false)
    }
  }

  // Don't render during SSR loading
  if (isLoading) {
    return null
  }

  // Don't render on desktop unless explicitly needed
  if (!isMobile && !extended) {
    return null
  }

  const fabContent = (
    <>
      {icon && (
        <span className={cn(
          'flex-shrink-0',
          isExtended && text && 'mr-2'
        )}>
          {icon}
        </span>
      )}
      {isExtended && text && (
        <span className="font-medium whitespace-nowrap">
          {text}
        </span>
      )}
      {children}
    </>
  )

  return (
    <Button
      className={cn(
        // Base styles
        'fixed z-50 rounded-full transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
        'touch-manipulation select-none',
        // Position
        positionClasses[position],
        // Size
        isExtended ? extendedSizeClasses[size] : sizeClasses[size],
        // Variant
        variantClasses[variant],
        // Auto-hide behavior
        shouldHide ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100',
        // Extended state
        isExtended ? 'justify-start' : 'justify-center',
        // Active state for mobile
        'active:scale-95',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {fabContent}
    </Button>
  )
}

/**
 * Speed Dial FAB component for multiple actions
 */
export interface SpeedDialAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export interface SpeedDialFABProps extends Omit<FABProps, 'onClick' | 'children'> {
  /**
   * List of actions for the speed dial
   */
  actions: SpeedDialAction[]
  /**
   * Direction of the speed dial
   */
  direction?: 'up' | 'down' | 'left' | 'right'
  /**
   * Whether to show labels for actions
   */
  showLabels?: boolean
}

export function SpeedDialFAB({
  actions,
  direction = 'up',
  showLabels = true,
  icon,
  position = 'bottom-right',
  ...fabProps
}: SpeedDialFABProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const speedDialRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedDialRef.current && !speedDialRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const toggleSpeedDial = () => {
    setIsOpen(!isOpen)
  }

  const handleActionClick = (action: SpeedDialAction) => {
    action.onClick()
    setIsOpen(false)
  }

  // Direction classes for actions
  const directionClasses = {
    up: 'flex-col-reverse',
    down: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row'
  }

  // Action positioning
  const getActionStyle = (index: number) => {
    const distance = 70 // Distance between actions
    const offset = (index + 1) * distance

    switch (direction) {
      case 'up':
        return { transform: `translateY(-${offset}px)` }
      case 'down':
        return { transform: `translateY(${offset}px)` }
      case 'left':
        return { transform: `translateX(-${offset}px)` }
      case 'right':
        return { transform: `translateX(${offset}px)` }
      default:
        return {}
    }
  }

  const mainIcon = icon || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )

  const closeIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )

  return (
    <div ref={speedDialRef} className="relative">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Actions */}
      {isOpen && (
        <div className={cn(
          'absolute flex gap-4 z-50',
          directionClasses[direction],
          // Position relative to FAB
          position.includes('bottom') ? 'bottom-full mb-4' : 'top-full mt-4',
          position.includes('right') ? 'right-0' : 'left-0'
        )}>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="relative flex items-center"
              style={getActionStyle(index)}
            >
              {/* Action label */}
              {showLabels && (
                <div className={cn(
                  'absolute whitespace-nowrap bg-gray-900 text-white text-sm px-2 py-1 rounded-md',
                  'opacity-0 animate-fade-in',
                  // Position label relative to button
                  position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                >
                  {action.label}
                </div>
              )}

              {/* Action button */}
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg',
                  'opacity-0 animate-slide-up',
                  action.disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                aria-label={action.label}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <FloatingActionButton
        {...fabProps}
        position={position}
        icon={isOpen ? closeIcon : mainIcon}
        onClick={toggleSpeedDial}
        className={cn(
          'transition-transform duration-200',
          isOpen && 'rotate-45'
        )}
      />
    </div>
  )
}

/**
 * Predefined FAB configurations for common use cases
 */
export const FABConfigs = {
  /**
   * Add new business FAB
   */
  addBusiness: (onClick: () => void) => (
    <FloatingActionButton
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      onClick={onClick}
      variant="primary"
      aria-label="Add new business"
    />
  ),

  /**
   * Chat/Contact FAB
   */
  contact: (onClick: () => void) => (
    <FloatingActionButton
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      onClick={onClick}
      variant="success"
      aria-label="Contact us"
    />
  ),

  /**
   * Filter FAB for search/listing pages
   */
  filter: (onClick: () => void, hasActiveFilters?: boolean) => (
    <FloatingActionButton
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      }
      onClick={onClick}
      variant={hasActiveFilters ? 'primary' : 'secondary'}
      aria-label="Filter results"
    />
  ),

  /**
   * Multi-action speed dial for business page
   */
  businessActions: (actions: {
    onCall?: () => void
    onDirections?: () => void
    onShare?: () => void
    onReview?: () => void
  }) => {
    const speedDialActions: SpeedDialAction[] = []

    if (actions.onCall) {
      speedDialActions.push({
        id: 'call',
        label: 'Call',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        ),
        onClick: actions.onCall
      })
    }

    if (actions.onDirections) {
      speedDialActions.push({
        id: 'directions',
        label: 'Directions',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        onClick: actions.onDirections
      })
    }

    if (actions.onShare) {
      speedDialActions.push({
        id: 'share',
        label: 'Share',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        ),
        onClick: actions.onShare
      })
    }

    if (actions.onReview) {
      speedDialActions.push({
        id: 'review',
        label: 'Review',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
        onClick: actions.onReview
      })
    }

    return (
      <SpeedDialFAB
        actions={speedDialActions}
        direction="up"
        variant="primary"
      />
    )
  }
}