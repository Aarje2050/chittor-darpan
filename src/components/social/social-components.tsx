// src/components/social/social-components.tsx - Fixed with Proper Types
import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, MessageCircle, Users, Heart, Check, X, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { socialService, messageRequestService } from '@/lib/database'
import { useAuth } from '@/lib/auth'

// Types
interface FollowButtonProps {
  targetUserId: string
  targetType?: 'user' | 'business'
  businessId?: string | null
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

interface UserCardProps {
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    user_type: string
    email?: string
  }
  showFollowButton?: boolean
  showMessageButton?: boolean
}

interface FollowRequestProps {
  request: {
    id: string
    follower_id: string
    follower_name?: string
    follower_avatar?: string
    created_at: string
  }
  onAccept: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
}

interface SocialStatsProps {
  userId: string
}

interface SocialStatsData {
  followers_count: number
  following_count: number
  businesses_following_count: number
}

// Follow/Unfollow Button Component
export function FollowButton({ 
  targetUserId, 
  targetType = 'user',
  businessId = null,
  size = 'sm',
  className = ''
}: FollowButtonProps) {
  const { user } = useAuth()
  const [followStatus, setFollowStatus] = useState<string | boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (!user || !targetUserId) return

    const checkStatus = async () => {
      setCheckingStatus(true)
      try {
        if (targetType === 'business' && businessId) {
          const { data } = await socialService.isFollowingBusiness(user.id, businessId)
          setFollowStatus(data ? 'accepted' : false)
        } else {
          const { data, status } = await socialService.isFollowing(user.id, targetUserId)
          setFollowStatus(status || false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
        setFollowStatus(false)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkStatus()
  }, [user, targetUserId, targetType, businessId])

  const handleFollow = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      let result
      if (targetType === 'business' && businessId) {
        result = await socialService.followBusiness(user.id, businessId)
      } else {
        result = await socialService.followUser(user.id, targetUserId)
      }

      if (result.success) {
        setFollowStatus(targetType === 'business' ? 'accepted' : 'pending')
      }
    } catch (error) {
      console.error('Error following:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      let result
      if (targetType === 'business' && businessId) {
        result = await socialService.unfollowBusiness(user.id, businessId)
      } else {
        result = await socialService.unfollowUser(user.id, targetUserId)
      }

      if (result.success) {
        setFollowStatus(false)
      }
    } catch (error) {
      console.error('Error unfollowing:', error)
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <Button size={size} disabled className={className}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </Button>
    )
  }

  if (!user || user.id === targetUserId) {
    return null
  }

  if (followStatus === 'accepted') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={handleUnfollow}
        disabled={loading}
        className={`${className} border-blue-500 text-blue-500 hover:bg-blue-50`}
      >
        <UserMinus className="w-4 h-4 mr-1" />
        {targetType === 'business' ? 'Following' : 'Following'}
      </Button>
    )
  }

  if (followStatus === 'pending') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={handleUnfollow}
        disabled={loading}
        className={`${className} border-yellow-500 text-yellow-600`}
      >
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Button>
    )
  }

  return (
    <Button
      size={size}
      onClick={handleFollow}
      disabled={loading}
      className={`${className} bg-blue-500 hover:bg-blue-600 text-white`}
    >
      <UserPlus className="w-4 h-4 mr-1" />
      {targetType === 'business' ? 'Follow' : 'Follow'}
    </Button>
  )
}

// User Card Component
export function UserCard({ 
  user, 
  showFollowButton = true, 
  showMessageButton = true 
}: UserCardProps) {
  const { user: currentUser } = useAuth()

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <img 
              src={user.avatar_url || '/default-avatar.png'} 
              alt={user.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.full_name || 'Anonymous User'}
            </h3>
            <p className="text-sm text-gray-500">
              @{user.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'}
            </p>
            {user.user_type === 'business_owner' && (
              <Badge variant="secondary" className="text-xs mt-1">
                Business Owner
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showMessageButton && currentUser && currentUser.id !== user.id && (
            <Button size="sm" variant="outline">
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          
          {showFollowButton && (
            <FollowButton
              targetUserId={user.id}
              targetType="user"
              size="sm"
            />
          )}
        </div>
      </div>
    </Card>
  )
}

// Follow Request Card Component
export function FollowRequestCard({ 
  request, 
  onAccept, 
  onReject 
}: FollowRequestProps) {
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept(request.id)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await onReject(request.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <img 
              src={request.follower_avatar || '/default-avatar.png'} 
              alt={request.follower_name || 'User'}
              className="w-full h-full object-cover"
            />
          </Avatar>
          
          <div>
            <h4 className="font-medium text-gray-900">
              {request.follower_name || 'Anonymous User'}
            </h4>
            <p className="text-sm text-gray-500">
              wants to follow you
            </p>
            <p className="text-xs text-gray-400">
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={loading}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Social Stats Component
export function SocialStats({ userId }: SocialStatsProps) {
  const [stats, setStats] = useState<SocialStatsData>({
    followers_count: 0,
    following_count: 0,
    businesses_following_count: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const loadStats = async () => {
      setLoading(true)
      try {
        const { data } = await socialService.getUserSocialStats(userId)
        if (data) {
          setStats(data)
        }
      } catch (error) {
        console.error('Error loading social stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId])

  if (loading) {
    return (
      <div className="flex space-x-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex space-x-6">
      <div className="text-center">
        <div className="font-semibold text-lg text-gray-900">
          {stats.followers_count}
        </div>
        <div className="text-sm text-gray-500">Followers</div>
      </div>
      
      <div className="text-center">
        <div className="font-semibold text-lg text-gray-900">
          {stats.following_count}
        </div>
        <div className="text-sm text-gray-500">Following</div>
      </div>
      
      <div className="text-center">
        <div className="font-semibold text-lg text-gray-900">
          {stats.businesses_following_count}
        </div>
        <div className="text-sm text-gray-500">Businesses</div>
      </div>
    </div>
  )
}

// Message Request List Component
export function MessageRequestsList() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadRequests = async () => {
      setLoading(true)
      try {
        const { data } = await messageRequestService.getMessageRequests(user.id)
        setRequests(data || [])
      } catch (error) {
        console.error('Error loading message requests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [user])

  const handleAccept = async (requestId: string) => {
    if (!user) return
    try {
      const { success } = await messageRequestService.acceptMessageRequest(requestId, user.id)
      if (success) {
        setRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!user) return
    try {
      const { success } = await messageRequestService.rejectMessageRequest(requestId, user.id)
      if (success) {
        setRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No message requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <img 
                  src={request.from_user_avatar || '/default-avatar.png'} 
                  alt={request.from_user_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </Avatar>
              
              <div>
                <h4 className="font-medium text-gray-900">
                  {request.from_user_name || 'Anonymous User'}
                </h4>
                <p className="text-sm text-gray-600 truncate max-w-[200px]">
                  {request.message_preview}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}