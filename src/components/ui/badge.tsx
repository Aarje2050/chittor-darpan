import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Badge variants for consistent, mobile-first styling
 * Optimized for readability on mobile screens
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
        destructive: 'border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80',
        success: 'border-transparent bg-green-500 text-gray-50 hover:bg-green-500/80',
        warning: 'border-transparent bg-yellow-500 text-gray-900 hover:bg-yellow-500/80',
        outline: 'text-gray-950 border-gray-200 hover:bg-gray-100',
        // Business status badges
        open: 'border-transparent bg-green-100 text-green-800',
        closed: 'border-transparent bg-red-100 text-red-800',
        featured: 'border-transparent bg-blue-100 text-blue-800',
        verified: 'border-transparent bg-emerald-100 text-emerald-800',
        // Category badges
        category: 'border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
        location: 'border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs', // Extra small for mobile
        default: 'px-2.5 py-1 text-xs', // Standard mobile-friendly size
        lg: 'px-3 py-1.5 text-sm', // Larger for prominence
        xl: 'px-4 py-2 text-sm' // Extra large for important badges
      },
      interactive: {
        true: 'cursor-pointer touch-manipulation active:scale-95',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether the badge is interactive (clickable)
   */
  interactive?: boolean
  /**
   * Icon to display before text
   */
  icon?: React.ReactNode
  /**
   * Icon to display after text (e.g., close button)
   */
  rightIcon?: React.ReactNode
  /**
   * Whether to show a dot indicator
   */
  dot?: boolean
}

/**
 * Mobile-first Badge component with touch-friendly design
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    interactive, 
    icon, 
    rightIcon, 
    dot,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, interactive }), className)}
        {...props}
      >
        {/* Dot indicator */}
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
        )}
        
        {/* Left icon */}
        {icon && (
          <span className="mr-1">
            {icon}
          </span>
        )}
        
        {/* Content */}
        {children}
        
        {/* Right icon */}
        {rightIcon && (
          <span className="ml-1">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

/**
 * Status Badge component for business status
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'open' | 'closed' | 'featured' | 'verified' | 'pending' | 'active' | 'inactive'
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const statusConfig = {
      open: { variant: 'open' as const, text: 'Open', icon: '●' },
      closed: { variant: 'closed' as const, text: 'Closed', icon: '●' },
      featured: { variant: 'featured' as const, text: 'Featured', icon: '★' },
      verified: { variant: 'verified' as const, text: 'Verified', icon: '✓' },
      pending: { variant: 'warning' as const, text: 'Pending', icon: '⏳' },
      active: { variant: 'success' as const, text: 'Active', icon: '●' },
      inactive: { variant: 'secondary' as const, text: 'Inactive', icon: '●' }
    }

    const config = statusConfig[status]

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        {...props}
      >
        <span className="mr-1">{config.icon}</span>
        {children || config.text}
      </Badge>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

/**
 * Category Badge component for business categories
 */
export interface CategoryBadgeProps extends Omit<BadgeProps, 'variant'> {
  category: string
  color?: string
  onRemove?: () => void
}

const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ category, color, onRemove, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="category"
        interactive={!!onRemove}
        className={cn(
          color && `bg-${color}-100 text-${color}-800 hover:bg-${color}-200`,
          className
        )}
        rightIcon={onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${category} category`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {...props}
      >
        {category}
      </Badge>
    )
  }
)
CategoryBadge.displayName = 'CategoryBadge'

/**
 * Rating Badge component for star ratings
 */
export interface RatingBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  rating: number
  maxRating?: number
  showValue?: boolean
}

const RatingBadge = React.forwardRef<HTMLDivElement, RatingBadgeProps>(
  ({ rating, maxRating = 5, showValue = true, ...props }, ref) => {
    const getVariant = (rating: number): BadgeProps['variant'] => {
      if (rating >= 4.5) return 'success'
      if (rating >= 4.0) return 'default'
      if (rating >= 3.0) return 'warning'
      return 'secondary'
    }

    return (
      <Badge
        ref={ref}
        variant={getVariant(rating)}
        icon={
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
        {...props}
      >
        {showValue && `${rating.toFixed(1)}`}
      </Badge>
    )
  }
)
RatingBadge.displayName = 'RatingBadge'

/**
 * Count Badge component for numbers/counts
 */
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  showPlus?: boolean
}

const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max, showPlus = true, ...props }, ref) => {
    const displayCount = max && count > max ? `${max}${showPlus ? '+' : ''}` : count.toString()

    return (
      <Badge
        ref={ref}
        variant="secondary"
        size="sm"
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)
CountBadge.displayName = 'CountBadge'

/**
 * Badge Group component for multiple related badges
 */
export interface BadgeGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  wrap?: boolean
  spacing?: 'sm' | 'default' | 'lg'
}

function BadgeGroup({ 
  children, 
  className, 
  orientation = 'horizontal',
  wrap = true,
  spacing = 'default'
}: BadgeGroupProps) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
    default: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
    lg: orientation === 'horizontal' ? 'gap-3' : 'gap-3'
  }

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        wrap && 'flex-wrap',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Notification Badge component for counts on icons
 */
export interface NotificationBadgeProps extends Omit<BadgeProps, 'children' | 'size'> {
  count: number
  max?: number
  show?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ 
    count, 
    max = 99, 
    show = true, 
    position = 'top-right',
    className,
    ...props 
  }, ref) => {
    if (!show || count <= 0) return null

    const positionClasses = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1',
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1'
    }

    const displayCount = count > max ? `${max}+` : count.toString()

    return (
      <Badge
        ref={ref}
        variant="destructive"
        className={cn(
          'absolute z-10 h-5 min-w-[20px] px-1 text-xs',
          'flex items-center justify-center',
          positionClasses[position],
          className
        )}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)
NotificationBadge.displayName = 'NotificationBadge'

export { 
  Badge, 
  StatusBadge, 
  CategoryBadge, 
  RatingBadge, 
  CountBadge, 
  BadgeGroup,
  NotificationBadge,
  badgeVariants 
}