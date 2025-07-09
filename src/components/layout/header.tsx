// src/components/layout/header.tsx - Enhanced for New Homepage Design
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, Bell, MessageCircle, Menu, X } from 'lucide-react'
import { useAuth, useAuthWithRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, signOut } = useAuth()
  const { userRole } = useAuthWithRole()
  const router = useRouter()
  
  // State for dropdowns
  const [exploreOpen, setExploreOpen] = useState(false)
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false)
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Search state - Only for desktop now
  const [searchQuery, setSearchQuery] = useState('')
  
  // Refs for click outside
  const exploreRef = useRef<HTMLDivElement>(null)
  const desktopUserMenuRef = useRef<HTMLDivElement>(null)
  const mobileUserMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false)
      }
      if (desktopUserMenuRef.current && !desktopUserMenuRef.current.contains(event.target as Node)) {
        setDesktopUserMenuOpen(false)
      }
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node)) {
        setMobileUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get dashboard URL based on user type
  const getDashboardUrl = () => {
    if (!user) return '/profile'
    
    console.log('User role for dashboard:', userRole) // Debug log
    
    if (userRole === 'admin') return '/dashboard/admin'
    if (userRole === 'business_owner') return '/dashboard/business'
    return '/profile'
  }

  // Handle search form submission - Desktop only
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setDesktopUserMenuOpen(false)
      setMobileUserMenuOpen(false)
      setMobileMenuOpen(false)
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Close all menus
  const closeAllMenus = () => {
    setExploreOpen(false)
    setDesktopUserMenuOpen(false)
    setMobileUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  return (
    <header className="w-full bg-white border-b border-gray-100 lg:sticky lg:top-0 lg:z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="block sm:hidden">
              <h1 className="text-base font-bold">
                <span className="text-gray-800">Chittor</span>
                <span className="bg-blue-500 text-white px-1.5 py-0.5 ml-1 rounded text-sm">Darpan</span>
              </h1>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">
                <span className="text-gray-800">Chittor</span>
                <span className="bg-blue-500 text-white px-2 py-1 ml-1 rounded">Darpan</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Search - Keep as is for desktop */}
          <div className="hidden lg:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0"
                />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            
            {/* Explore Dropdown */}
            <div className="relative" ref={exploreRef}>
              <Button
                variant="ghost"
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 px-4 py-2 h-10 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium"
              >
                <span>Explore</span>
                <ChevronDown className={cn('h-4 w-4 inline-block align-middle transition-transform', exploreOpen && 'rotate-180')} />
              </Button>
              
              {exploreOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
                  <Link href="/businesses" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    All Businesses
                  </Link>
                  <Link href="/categories" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Categories
                  </Link>
                  <Link href="/areas" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Areas
                  </Link>
                  <Link href="/tourism" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Places to Visit
                  </Link>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <Link href="/add-business">
              <Button variant="ghost" className="flex items-center gap-2 px-4 h-10 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium">
                Add Business
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">Free</span>
              </Button>
            </Link>

            <Link href="/search">
              <Button variant="ghost" className="px-4 h-10">Write Review</Button>
            </Link>

            {/* Notifications & Messages */}
            <Button variant="ghost" size="sm" className="p-2.5 h-10 w-10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <Button variant="ghost" size="sm" className="p-2.5 h-10 w-10 relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
            </Button>

            {/* User Menu or Login */}
            {user ? (
              <div className="relative" ref={desktopUserMenuRef}>
                <Button
                  variant="ghost"
                  onClick={() => setDesktopUserMenuOpen(!desktopUserMenuOpen)}
                  className="flex items-center gap-1 px-3 py-2 h-10 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium"
                >
                  <span className="inline-block align-middle mr-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                        {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                         user.user_metadata?.name?.charAt(0)?.toUpperCase() ||
                         user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </span>
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name?.split(' ')[0] || 
                     user.user_metadata?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-4 w-4 inline-block align-middle" />
                </Button>

                {desktopUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link href="/profile" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link href={getDashboardUrl()} onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/business/my-listings" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      My Listings
                    </Link>
                    <Link href="/collections" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Saved Businesses
                    </Link>
                    <Link href="/profile?tab=account" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Account Settings
                    </Link>
                    
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 h-10">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Icons - Simplified */}
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Mobile Notifications & Messages */}
            {user && (
              <>
                <Button variant="ghost" size="sm" className="p-2 h-10 w-10 relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>

                <Button variant="ghost" size="sm" className="p-2 h-10 w-10 relative">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
                </Button>
              </>
            )}
            
            {user ? (
              <div className="relative" ref={mobileUserMenuRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 h-10 w-10"
                  onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                       user.user_metadata?.name?.charAt(0)?.toUpperCase() ||
                       user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                
                {/* Mobile User Dropdown */}
                {mobileUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link href="/profile" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link href={getDashboardUrl()} onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/business/my-listings" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      My Listings
                    </Link>
                    <Link href="/profile?tab=saved" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Saved Businesses
                    </Link>
                    <Link href="/profile?tab=account" onClick={closeAllMenus} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Account Settings
                    </Link>
                    
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm px-3 py-2 h-10">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="py-4 space-y-1">

              {/* Mobile Explore Menu */}
              <div className="px-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Explore</p>
                <Link href="/businesses" onClick={closeAllMenus} className="block py-3 text-gray-700 font-medium">
                  All Businesses
                </Link>
                <Link href="/categories" onClick={closeAllMenus} className="block py-3 text-gray-700 font-medium">
                  Categories
                </Link>
                <Link href="/areas" onClick={closeAllMenus} className="block py-3 text-gray-700 font-medium">
                  Areas
                </Link>
                <Link href="/tourism" onClick={closeAllMenus} className="block py-3 text-gray-700 font-medium">
                  Places to Visit
                </Link>
              </div>

              {/* Mobile Actions */}
              <div className="px-4 border-t border-gray-100 pt-4">
                <Link href="/add-business" onClick={closeAllMenus} className="flex items-center justify-between py-3 text-gray-900 font-medium">
                  <span>Add Your Business</span>
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">Free</span>
                </Link>
                <Link href="/search" onClick={closeAllMenus} className="block py-3 text-gray-700 font-medium">
                  Write a Review
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}