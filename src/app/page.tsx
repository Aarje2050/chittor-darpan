'use client'

import { MobileHeader } from '@/components/mobile/mobile-header'
import { SearchInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: '1', name: 'Restaurants', icon: '🍽️', count: 25 },
    { id: '2', name: 'Hotels', icon: '🏨', count: 12 },
    { id: '3', name: 'Shops', icon: '🛍️', count: 40 },
    { id: '4', name: 'Services', icon: '🔧', count: 18 },
    { id: '5', name: 'Medical', icon: '🏥', count: 15 },
    { id: '6', name: 'Education', icon: '📚', count: 8 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Chittor Darpan" showSearch={false} autoHide={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Chittorgarh</h1>
          <p className="text-gray-600">Discover local businesses in your city</p>
          <p className="text-sm text-blue-600">
            <a href="/login" className="underline">Sign in</a> to save favorites and write reviews
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <SearchInput
              placeholder="Search businesses, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">150+</div>
              <div className="text-sm text-gray-600">Businesses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Browse Categories</span>
              <Badge variant="secondary">{categories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="text-center">
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.count} businesses</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured */}
        <Card>
          <CardHeader>
            <CardTitle>Featured This Week</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">🍕</div>
                  <div className="flex-1">
                    <h4 className="font-medium">Pizza Corner</h4>
                    <p className="text-sm text-gray-600">Best pizza in town</p>
                  </div>
                  <Badge variant="featured">Featured</Badge>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">🏨</div>
                  <div className="flex-1">
                    <h4 className="font-medium">Royal Hotel</h4>
                    <p className="text-sm text-gray-600">Luxury accommodation</p>
                  </div>
                  <Badge variant="featured">Featured</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Test */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Test Authentication</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-gray-600">Simple authentication test:</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              fullWidth
              className="justify-start"
            >
              🔐 Test Google Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = '/profile'}
              variant="outline"
              fullWidth
              className="justify-start"
            >
              👤 Check Profile (Auth Required)
            </Button>
          </CardContent>
        </Card>

        {/* Phase Status */}
        <Card>
          <CardHeader>
            <CardTitle>Phase 2: Simple Authentication ✅</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm space-y-1">
            <p>✅ No complex context or loading states</p>
            <p>✅ Direct Supabase auth calls</p>
            <p>✅ Simple login/logout flow</p>
            <p>✅ Route groups working</p>
            <p className="text-blue-600 font-medium">🎯 Ready to test authentication!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}