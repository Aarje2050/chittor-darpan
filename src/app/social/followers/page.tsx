// src/app/social/followers/page.tsx - Followers Page  
'use client'

import React, { useState, useEffect } from 'react'
import { useRequireAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { socialService } from '@/lib/database'
import { UserCard } from '@/components/social/social-components'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function FollowersPage() {
  const { user, loading, shouldRedirect } = useRequireAuth()
  const router = useRouter()
  const [followers, setFollowers] = useState([])
  const [loadingFollowers, setLoadingFollowers] = useState(true)

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login')
    }
  }, [shouldRedirect, router])

  useEffect(() => {
    if (!user) return

    const loadFollowers = async () => {
      setLoadingFollowers(true)
      try {
        const { data } = await socialService.getUserFollowers(user.id, 'accepted')
        setFollowers(data || [])
      } catch (error) {
        console.error('Error loading followers:', error)
      } finally {
        setLoadingFollowers(false)
      }
    }

    loadFollowers()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Your Followers
          </h1>
          <p className="text-gray-600">People who follow you</p>
        </div>

        {loadingFollowers ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : followers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No followers yet</h3>
            <p className="text-gray-500">When people follow you, they'll appear here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {followers.map(follower => (
              <UserCard
                key={follower.id}
                user={{
                  id: follower.follower_id,
                  full_name: follower.follower_name,
                  avatar_url: follower.follower_avatar,
                  user_type: 'user'
                }}
                showFollowButton={true}
                showMessageButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}