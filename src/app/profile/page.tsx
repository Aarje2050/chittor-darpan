'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" showBackButton={true} />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" showBackButton={true} />
        <div className="px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Profile" showBackButton={true} />
      
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Working!</h2>
            <p className="text-gray-600">You are successfully signed in</p>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user.user_metadata?.full_name || 'User'}</h3>
                <p className="text-gray-600">{user.email}</p>
                <Badge variant="success" size="sm" className="mt-1">Authenticated</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 text-white py-4 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>

        {/* Success Message */}
        <Card>
          <CardHeader>
            <CardTitle>🎉 Phase 2 Complete!</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm space-y-2">
            <p>✅ Google OAuth login working</p>
            <p>✅ User authentication successful</p>
            <p>✅ Sign out functionality working</p>
            <p>✅ User data retrieved from Supabase</p>
            <p className="text-blue-600 font-medium pt-2">Ready for Phase 3: Database Tables!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}