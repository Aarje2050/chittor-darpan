import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with proper Tailwind CSS merging
 * Essential for component styling and conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mobile detection utilities
 */
export const mobileUtils = {
  /**
   * Check if current device is mobile based on user agent
   */
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  },

  /**
   * Check if current device supports touch
   */
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false
    
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           (navigator as any).msMaxTouchPoints > 0
  },

  /**
   * Get screen size category
   */
  getScreenSize: (): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  },

  /**
   * Check if device is in standalone mode (PWA)
   */
  isStandalone: (): boolean => {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }
}

/**
 * Format phone number for display and calling
 */
export function formatPhoneNumber(phone: string): {
  display: string
  href: string
} {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Indian mobile number formatting
  if (cleaned.length === 10) {
    const formatted = `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`
    return {
      display: formatted,
      href: `tel:+91${cleaned}`
    }
  }
  
  // If already has country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2)
    const formatted = `+91 ${number.substring(0, 5)} ${number.substring(5)}`
    return {
      display: formatted,
      href: `tel:+${cleaned}`
    }
  }
  
  // Fallback - return as is
  return {
    display: phone,
    href: `tel:${phone}`
  }
}

/**
 * Generate Google Maps directions URL
 */
export function getDirectionsUrl(address: string, businessName?: string): string {
  const query = businessName ? `${businessName}, ${address}` : address
  const encoded = encodeURIComponent(query)
  
  // Check if mobile for app deep linking
  if (mobileUtils.isMobile()) {
    return `https://maps.google.com/maps?daddr=${encoded}&amp;ll=`
  }
  
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
}

/**
 * Generate WhatsApp chat URL
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  // Ensure it has country code
  const fullNumber = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  
  const defaultMessage = message || 'Hi, I found your business on Chittor Darpan!'
  const encodedMessage = encodeURIComponent(defaultMessage)
  
  return `https://wa.me/${fullNumber}?text=${encodedMessage}`
}

/**
 * Generate business slug from name
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validate Indian mobile number
 */
export function isValidIndianMobile(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  
  // Indian mobile numbers: 10 digits starting with 6-9
  if (cleaned.length === 10) {
    return /^[6-9]\d{9}$/.test(cleaned)
  }
  
  // With country code: 12 digits starting with 91
  if (cleaned.length === 12) {
    return /^91[6-9]\d{9}$/.test(cleaned)
  }
  
  return false
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format business hours for display
 */
export function formatBusinessHours(hours: {
  day_of_week: number
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
}[]): string[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  return hours.map(hour => {
    const day = days[hour.day_of_week]
    
    if (hour.is_closed || !hour.opens_at || !hour.closes_at) {
      return `${day}: Closed`
    }
    
    // Format time (assuming HH:MM format)
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour24 = parseInt(hours)
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      const hour12 = hour24 % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    }
    
    return `${day}: ${formatTime(hour.opens_at)} - ${formatTime(hour.closes_at)}`
  })
}

/**
 * Get current business status
 */
export function getBusinessStatus(hours: {
  day_of_week: number
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
}[]): {
  isOpen: boolean
  message: string
  nextChange?: string
} {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const todayHours = hours.find(h => h.day_of_week === currentDay)
  
  if (!todayHours || todayHours.is_closed || !todayHours.opens_at || !todayHours.closes_at) {
    return {
      isOpen: false,
      message: 'Closed today'
    }
  }
  
  const isCurrentlyOpen = currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
  
  if (isCurrentlyOpen) {
    return {
      isOpen: true,
      message: `Open until ${formatTime(todayHours.closes_at)}`
    }
  } else if (currentTime < todayHours.opens_at) {
    return {
      isOpen: false,
      message: `Opens at ${formatTime(todayHours.opens_at)}`
    }
  } else {
    return {
      isOpen: false,
      message: 'Closed for today'
    }
  }
}

/**
 * Helper function to format time
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour24 = parseInt(hours)
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Share business via Web Share API (mobile) or fallback
 */
export async function shareMessage(data: {
  title: string
  text: string
  url: string
}): Promise<boolean> {
  // Check if Web Share API is available (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share(data)
      return true
    } catch (error) {
      // User cancelled or error occurred
      console.warn('Share failed:', error)
    }
  }
  
  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`)
    return true
  } catch (error) {
    console.warn('Clipboard write failed:', error)
    return false
  }
}

/**
 * Get image optimization parameters for Next.js Image component
 */
export function getImageProps(
  src: string,
  alt: string,
  width?: number,
  height?: number
) {
  return {
    src,
    alt,
    width: width || 400,
    height: height || 300,
    className: 'object-cover',
    loading: 'lazy' as const,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
}

/**
 * Format rating for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/**
 * Get rating stars representation
 */
export function getRatingStars(rating: number): {
  full: number
  half: boolean
  empty: number
} {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  
  return { full, half, empty }
}

/**
 * Constants for the application
 */
export const APP_CONSTANTS = {
  CITY_NAME: 'Chittorgarh',
  CITY_SLUG: 'chittorgarh',
  PHONE_REGEX: /^[6-9]\d{9}$/,
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  ITEMS_PER_PAGE: 20,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  DEFAULT_COORDINATES: {
    lat: 24.8887,
    lng: 74.6269
  }
} as const