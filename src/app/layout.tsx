import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { BottomNavigation, type NavigationItem } from '@/components/mobile/bottom-navigation'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

// Simple navigation items for Phase 1
const mainNavItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    exactMatch: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  },
  {
    id: 'categories',
    label: 'Categories',
    href: '/categories',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4l-7 7-7-7m14 8l-7-7-7 7" />
      </svg>
    )
  },
  {
    id: 'nearby',
    label: 'Nearby',
    href: '/areas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
]

export const metadata: Metadata = {
  title: 'Chittor Darpan - Chittorgarh Business Directory',
  description: 'Discover local businesses in Chittorgarh. Find restaurants, hotels, shops, and services near you.',
  keywords: ['Chittorgarh', 'business directory', 'local businesses', 'restaurants', 'hotels', 'shops'],
  authors: [{ name: 'Chittor Darpan' }],
  creator: 'Chittor Darpan',
  publisher: 'Chittor Darpan',
  
  // Mobile-first meta tags
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true
  },
  
  // iOS specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chittor Darpan'
  },
  
  // PWA ready
  manifest: '/manifest.json',
  
  // Open Graph for sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chittordarpan.com',
    siteName: 'Chittor Darpan',
    title: 'Chittor Darpan - Chittorgarh Business Directory',
    description: 'Discover local businesses in Chittorgarh. Find restaurants, hotels, shops, and services near you.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Chittor Darpan - Chittorgarh Business Directory'
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Chittor Darpan - Chittorgarh Business Directory',
    description: 'Discover local businesses in Chittorgarh. Find restaurants, hotels, shops, and services near you.',
    images: ['/og-image.jpg']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(inter.variable, 'antialiased')}>
      <head>
        {/* Additional mobile optimizations */}
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Prevent zoom on input focus (iOS) */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans',
        // Mobile-first body classes
        'text-base leading-relaxed',
        // Prevent horizontal scroll
        'overflow-x-hidden',
        // Touch improvements
        'touch-manipulation'
      )}>
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>

        {/* Auth Provider Wrapper */}
        <AuthProvider>
          {/* Main app container */}
          <div className="flex flex-col min-h-screen">
            {/* Main content area */}
            <main 
              id="main-content"
              className={cn(
                'flex-1',
                // Account for bottom navigation on mobile
                'pb-16 md:pb-0'
              )}
            >
              {children}
            </main>

            {/* Mobile bottom navigation */}
            <BottomNavigation 
              items={mainNavItems}
              showLabels={true}
              autoHide={true}
            />
          </div>
        </AuthProvider>

        {/* Global loading indicator (for future use) */}
        <div id="global-loading" className="hidden">
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}