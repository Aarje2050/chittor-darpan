import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Input variants for consistent, mobile-first styling
 * All inputs meet minimum 48px height for mobile usability
 */
const inputVariants = cva(
  // Base styles - mobile-first design
  'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:ring-black',
        error: 'border-red-500 focus-visible:ring-red-500 text-red-900 placeholder:text-red-400',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-11 px-3 py-2 text-xs', // 44px minimum height
        default: 'h-12 px-3 py-3 text-sm', // 48px - comfortable for mobile
        lg: 'h-14 px-4 py-4 text-base', // 56px - more prominent
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Left icon to display inside input
   */
  leftIcon?: React.ReactNode
  /**
   * Right icon to display inside input (e.g., clear button)
   */
  rightIcon?: React.ReactNode
  /**
   * Error message to display below input
   */
  error?: string
  /**
   * Success message to display below input
   */
  success?: string
  /**
   * Helper text to display below input
   */
  helperText?: string
  /**
   * Label text
   */
  label?: string
  /**
   * Whether the field is required
   */
  required?: boolean
  /**
   * Loading state
   */
  loading?: boolean
}

/**
 * Mobile-optimized Input component with touch-friendly design
 * Includes proper keyboard types for mobile and accessibility features
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    variant,
    size,
    leftIcon,
    rightIcon,
    error,
    success,
    helperText,
    label,
    required,
    loading,
    id,
    ...props
  }, ref) => {
    // Generate unique ID if not provided
    const inputId = id || React.useId()
    
    // Determine the actual variant based on state
    const actualVariant = error ? 'error' : success ? 'success' : variant
    
    // Optimize input type for mobile keyboards
    const getOptimizedType = (type: string) => {
      switch (type) {
        case 'phone':
          return 'tel'
        case 'email':
          return 'email'
        case 'number':
          return 'number'
        case 'url':
          return 'url'
        case 'search':
          return 'search'
        default:
          return type
      }
    }

    // Get appropriate inputMode for mobile keyboards
    const getInputMode = (type: string): React.HTMLAttributes<HTMLInputElement>['inputMode'] => {
      switch (type) {
        case 'phone':
        case 'tel':
          return 'tel'
        case 'email':
          return 'email'
        case 'number':
          return 'numeric'
        case 'url':
          return 'url'
        case 'search':
          return 'search'
        default:
          return 'text'
      }
    }

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              required && "after:content-['*'] after:text-red-500 after:ml-1"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={getOptimizedType(type)}
            inputMode={getInputMode(type)}
            id={inputId}
            className={cn(
              inputVariants({ variant: actualVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              success ? `${inputId}-success` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner />
            </div>
          )}
        </div>

        {/* Helper/Error/Success Messages */}
        {(error || success || helperText) && (
          <div className="mt-1">
            {error && (
              <p
                id={`${inputId}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
            {success && !error && (
              <p
                id={`${inputId}-success`}
                className="text-sm text-green-600"
              >
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p
                id={`${inputId}-helper`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Loading spinner for input loading states
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-gray-400"
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
 * Textarea component with similar styling to Input
 */
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  error?: string
  success?: string
  helperText?: string
  label?: string
  required?: boolean
  /**
   * Auto-resize based on content
   */
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    error,
    success,
    helperText,
    label,
    required,
    autoResize = false,
    id,
    ...props
  }, ref) => {
    const textareaId = id || React.useId()
    const actualVariant = error ? 'error' : success ? 'success' : variant
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        const adjustHeight = () => {
          textarea.style.height = 'auto'
          textarea.style.height = `${textarea.scrollHeight}px`
        }
        
        textarea.addEventListener('input', adjustHeight)
        adjustHeight() // Initial adjustment
        
        return () => textarea.removeEventListener('input', adjustHeight)
      }
    }, [autoResize])

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLTextAreaElement) => {
      textareaRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }, [ref])

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              required && "after:content-['*'] after:text-red-500 after:ml-1"
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          className={cn(
            'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm transition-all duration-200 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none',
            actualVariant === 'error' && 'border-red-500 focus-visible:ring-red-500 text-red-900 placeholder:text-red-400',
            actualVariant === 'success' && 'border-green-500 focus-visible:ring-green-500',
            !autoResize && 'resize-y',
            'min-h-[80px]', // Minimum height for mobile usability
            className
          )}
          ref={combinedRef}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : 
            success ? `${textareaId}-success` : 
            helperText ? `${textareaId}-helper` : 
            undefined
          }
          {...props}
        />

        {/* Helper/Error/Success Messages */}
        {(error || success || helperText) && (
          <div className="mt-1">
            {error && (
              <p
                id={`${textareaId}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
            {success && !error && (
              <p
                id={`${textareaId}-success`}
                className="text-sm text-green-600"
              >
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p
                id={`${textareaId}-helper`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

/**
 * Search Input component optimized for mobile search
 */
export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onClear?: () => void
  showClearButton?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, rightIcon, value, ...props }, ref) => {
    const showClear = showClearButton && value && String(value).length > 0

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          showClear ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : rightIcon
        }
        value={value}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

export { Input, Textarea, SearchInput, inputVariants }