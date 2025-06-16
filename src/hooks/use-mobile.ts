import { useState, useEffect } from 'react'
import { mobileUtils } from '@/lib/utils'

/**
 * Custom hook for mobile detection and responsive behavior
 * Provides real-time mobile state management with SSR compatibility
 */
export function useMobile() {
  // Initialize with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isTouch, setIsTouch] = useState<boolean | null>(null)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null)

  useEffect(() => {
    // Initial detection
    const checkMobileState = () => {
      setIsMobile(mobileUtils.isMobile())
      setIsTouch(mobileUtils.isTouchDevice())
      setScreenSize(mobileUtils.getScreenSize())
      setIsStandalone(mobileUtils.isStandalone())
    }

    // Run initial check
    checkMobileState()

    // Listen for resize events to update screen size
    const handleResize = () => {
      setScreenSize(mobileUtils.getScreenSize())
    }

    window.addEventListener('resize', handleResize)

    // Listen for orientation changes (mobile specific)
    const handleOrientationChange = () => {
      // Small delay to let the browser adjust
      setTimeout(checkMobileState, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return {
    isMobile,
    isTouch,
    screenSize,
    isStandalone,
    // Convenience computed properties
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    // Loading state for SSR compatibility
    isLoading: isMobile === null
  }
}

/**
 * Hook for detecting specific mobile orientations
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null)

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
      }
    }

    checkOrientation()

    const handleOrientationChange = () => {
      // Delay to allow browser to update dimensions
      setTimeout(checkOrientation, 100)
    }

    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isLoading: orientation === null
  }
}

/**
 * Hook for safe area insets (iOS notch handling)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      if (typeof window !== 'undefined' && CSS.supports('padding-top: env(safe-area-inset-top)')) {
        const computedStyle = getComputedStyle(document.documentElement)
        
        setSafeArea({
          top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0,
          bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0,
          left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left')) || 0,
          right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right')) || 0
        })
      }
    }

    updateSafeArea()

    window.addEventListener('resize', updateSafeArea)
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}

/**
 * Hook for viewport dimensions with mobile considerations
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    availableHeight: 0 // Height minus mobile UI elements
  })

  useEffect(() => {
    const updateViewport = () => {
      if (typeof window !== 'undefined') {
        // Use visual viewport API if available (mobile browsers)
        const visualViewport = (window as any).visualViewport
        
        if (visualViewport) {
          setViewport({
            width: visualViewport.width,
            height: visualViewport.height,
            availableHeight: visualViewport.height
          })
        } else {
          // Fallback for older browsers
          const width = window.innerWidth
          const height = window.innerHeight
          
          setViewport({
            width,
            height,
            availableHeight: height
          })
        }
      }
    }

    updateViewport()

    // Listen to visual viewport changes (keyboard show/hide on mobile)
    const visualViewport = (window as any).visualViewport
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateViewport)
      visualViewport.addEventListener('scroll', updateViewport)
    }

    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateViewport)
        visualViewport.removeEventListener('scroll', updateViewport)
      }
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  return viewport
}

/**
 * Hook for detecting when mobile keyboard is open
 */
export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const viewport = useViewport()
  const { isMobile } = useMobile()

  useEffect(() => {
    if (!isMobile) {
      setIsKeyboardOpen(false)
      return
    }

    // Detect keyboard by comparing viewport height changes
    const initialHeight = window.innerHeight
    const currentHeight = viewport.availableHeight
    
    // If height decreased by more than 150px, assume keyboard is open
    const keyboardThreshold = 150
    const heightDifference = initialHeight - currentHeight
    
    setIsKeyboardOpen(heightDifference > keyboardThreshold)
  }, [viewport.availableHeight, isMobile])

  return isKeyboardOpen
}

/**
 * Hook for mobile-specific scroll behavior
 */
export function useMobileScroll() {
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { isMobile } = useMobile()

  useEffect(() => {
    if (!isMobile) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up')
      }
      
      setLastScrollY(currentScrollY)
      setIsScrolling(true)

      // Clear timeout and set new one
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [lastScrollY, isMobile])

  return {
    isScrolling,
    scrollDirection,
    scrollY: lastScrollY
  }
}

/**
 * Hook for touch gesture detection
 */
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const { isTouch } = useMobile()

  const getTouchEventData = (e: TouchEvent) => ({
    x: e.targetTouches[0].clientX,
    y: e.targetTouches[0].clientY
  })

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(getTouchEventData(e))
  }

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(getTouchEventData(e))
  }

  const detectSwipe = (): 'left' | 'right' | 'up' | 'down' | null => {
    if (!touchStart || !touchEnd) return null

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > 50
    const isRightSwipe = distanceX < -50
    const isUpSwipe = distanceY > 50
    const isDownSwipe = distanceY < -50

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      return isLeftSwipe ? 'left' : isRightSwipe ? 'right' : null
    } else {
      return isUpSwipe ? 'up' : isDownSwipe ? 'down' : null
    }
  }

  return {
    handleTouchStart,
    handleTouchMove,
    detectSwipe,
    isTouch
  }
}