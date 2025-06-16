import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button variants using CVA for consistent, mobile-first styling
 * All buttons meet minimum 44px touch target requirement
 */
const buttonVariants = cva(
  // Base styles - mobile-first design
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation select-none',
  {
    variants: {
      variant: {
        // Primary button - black theme
        default: 'bg-black text-white hover:bg-gray-800 focus-visible:ring-gray-500 active:bg-gray-900',
        
        // Destructive actions (delete, remove)
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800',
        
        // Secondary outline button
        outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500 active:bg-gray-100',
        
        // Secondary filled button
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 active:bg-gray-300',
        
        // Ghost button (minimal style)
        ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 active:bg-gray-200',
        
        // Link style button
        link: 'text-black underline-offset-4 hover:underline focus-visible:ring-gray-500'
      },
      size: {
        // Touch-friendly sizes (minimum 44px height)
        default: 'h-12 px-4 py-2', // 48px height
        sm: 'h-11 px-3 text-xs', // 44px height - minimum for mobile
        lg: 'h-14 px-8 text-base', // 56px height - more prominent
        xl: 'h-16 px-10 text-lg', // 64px height - very prominent
        icon: 'h-12 w-12' // Square touch target
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Whether button should take full width of container
   */
  fullWidth?: boolean
  /**
   * Loading state with spinner
   */
  loading?: boolean
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode
}

/**
 * Mobile-first Button component with touch-friendly design
 * Meets WCAG accessibility standards and mobile usability guidelines
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          // Additional mobile optimizations
          'relative overflow-hidden',
          // Disabled state
          disabled && 'cursor-not-allowed',
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <LoadingSpinner />
          </div>
        )}
        
        {/* Button content */}
        <div className={cn(
          'flex items-center justify-center gap-2',
          loading && 'opacity-0'
        )}>
          {leftIcon && (
            <span className="flex-shrink-0">
              {leftIcon}
            </span>
          )}
          
          {children && (
            <span className="truncate">
              {children}
            </span>
          )}
          
          {rightIcon && (
            <span className="flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </div>
      </button>
    )
  }
)

Button.displayName = 'Button'

/**
 * Loading spinner component for button loading states
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Icon button component for action buttons with just icons
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string // Required for accessibility
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', variant = 'ghost', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'

/**
 * Floating Action Button component for mobile primary actions
 */
export interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6 z-50',
      'bottom-left': 'fixed bottom-6 left-6 z-50',
      'top-right': 'fixed top-6 right-6 z-50',
      'top-left': 'fixed top-6 left-6 z-50'
    }

    return (
      <Button
        ref={ref}
        size="lg"
        className={cn(
          positionClasses[position],
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
          'h-14 w-14', // 56px circle
          className
        )}
        {...props}
      />
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

/**
 * Button group component for related actions
 */
export interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  fullWidth?: boolean
}

function ButtonGroup({ 
  children, 
  className, 
  orientation = 'horizontal',
  fullWidth = false 
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
        fullWidth && 'w-full',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<any>
          return React.cloneElement(childElement, {
            ...childElement.props,
            className: cn(
              childElement.props.className,
              // Remove border radius for middle buttons
              index > 0 && orientation === 'horizontal' && 'rounded-l-none',
              index < React.Children.count(children) - 1 && orientation === 'horizontal' && 'rounded-r-none',
              index > 0 && orientation === 'vertical' && 'rounded-t-none',
              index < React.Children.count(children) - 1 && orientation === 'vertical' && 'rounded-b-none',
              // Full width for vertical groups
              orientation === 'vertical' && fullWidth && 'w-full'
            )
          })
        }
        return child
      })}
    </div>
  )
}

export { Button, IconButton, FloatingActionButton, ButtonGroup, buttonVariants }