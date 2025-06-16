import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Card variants for consistent, mobile-first styling
 * Optimized for touch interactions and mobile viewing
 */
const cardVariants = cva(
  'rounded-lg border bg-white text-gray-950 shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        outline: 'border-gray-300',
        elevated: 'border-gray-200 shadow-md',
        ghost: 'border-transparent shadow-none'
      },
      padding: {
        none: '',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6'
      },
      interactive: {
        true: 'cursor-pointer touch-manipulation hover:shadow-md hover:border-gray-300 active:scale-[0.98] active:shadow-sm',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      interactive: false
    }
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Whether the card should be interactive (clickable)
   */
  interactive?: boolean
}

/**
 * Base Card component with mobile-first design
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

/**
 * Card Header component for titles and actions
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Actions to display on the right side (mobile-friendly)
   */
  actions?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-3 space-y-0',
        // Mobile-optimized spacing
        'pb-3',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
)
CardHeader.displayName = 'CardHeader'

/**
 * Card Title component
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-semibold leading-tight tracking-tight',
      // Mobile-optimized text sizes
      'text-lg md:text-xl',
      // Ensure text doesn't overflow
      'truncate',
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

/**
 * Card Description component
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-gray-500 leading-relaxed',
      // Mobile line clamping for better layout
      'line-clamp-2',
      className
    )}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

/**
 * Card Content component for main content area
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

/**
 * Card Footer component for actions and metadata
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-3 pt-3 border-t border-gray-100',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

/**
 * Image Card component for business listings
 */
export interface ImageCardProps extends CardProps {
  /**
   * Image source URL
   */
  imageSrc: string
  /**
   * Image alt text
   */
  imageAlt: string
  /**
   * Image aspect ratio
   */
  aspectRatio?: 'square' | 'video' | 'photo'
  /**
   * Overlay content on the image
   */
  imageOverlay?: React.ReactNode
}

const ImageCard = React.forwardRef<HTMLDivElement, ImageCardProps>(
  ({ 
    className, 
    imageSrc, 
    imageAlt, 
    aspectRatio = 'photo',
    imageOverlay,
    children,
    ...props 
  }, ref) => {
    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      photo: 'aspect-[4/3]'
    }

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} padding="none" {...props}>
        {/* Image Container */}
        <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio])}>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {imageOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-3 left-3 right-3 text-white">
                {imageOverlay}
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        {children && (
          <div className="p-4">
            {children}
          </div>
        )}
      </Card>
    )
  }
)
ImageCard.displayName = 'ImageCard'

/**
 * Business Card component specifically for business listings
 */
export interface BusinessCardProps extends CardProps {
  /**
   * Business name
   */
  name: string
  /**
   * Business description
   */
  description?: string
  /**
   * Business image
   */
  image?: string
  /**
   * Business category
   */
  category?: string
  /**
   * Business location
   */
  location?: string
  /**
   * Business rating
   */
  rating?: number
  /**
   * Number of reviews
   */
  reviewCount?: number
  /**
   * Whether business is open
   */
  isOpen?: boolean
  /**
   * Business phone number
   */
  phone?: string
  /**
   * Click handler for the card
   */
  onCardClick?: () => void
  /**
   * Quick action buttons
   */
  quickActions?: React.ReactNode
}

const BusinessCard = React.forwardRef<HTMLDivElement, BusinessCardProps>(
  ({
    name,
    description,
    image,
    category,
    location,
    rating,
    reviewCount,
    isOpen,
    phone,
    onCardClick,
    quickActions,
    className,
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('group', className)}
        interactive={!!onCardClick}
        onClick={onCardClick}
        padding="none"
        {...props}
      >
        <div className="flex gap-3 p-4">
          {/* Business Image */}
          {image ? (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}

          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                {category && (
                  <p className="text-sm text-gray-500 truncate">{category}</p>
                )}
              </div>
              
              {/* Status Badge */}
              {typeof isOpen !== 'undefined' && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                )}>
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </div>

            {/* Location */}
            {location && (
              <p className="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </p>
            )}

            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
                </div>
                {reviewCount && (
                  <span className="text-sm text-gray-500">({reviewCount})</span>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {quickActions && (
          <div className="px-4 pb-4 pt-0">
            {quickActions}
          </div>
        )}
      </Card>
    )
  }
)
BusinessCard.displayName = 'BusinessCard'

/**
 * Stats Card component for dashboards
 */
export interface StatsCardProps extends CardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, change, icon, className, ...props }, ref) => (
    <Card ref={ref} className={className} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 mt-1 text-sm',
              change.trend === 'up' && 'text-green-600',
              change.trend === 'down' && 'text-red-600',
              change.trend === 'neutral' && 'text-gray-600'
            )}>
              {change.trend === 'up' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              )}
              {change.trend === 'down' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
)
StatsCard.displayName = 'StatsCard'

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  ImageCard,
  BusinessCard,
  StatsCard,
  cardVariants 
}