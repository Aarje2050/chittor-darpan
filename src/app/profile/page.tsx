'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  MessageCircle, 
  Camera, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Edit, 
  Settings, 
  MoreHorizontal,
  Users,
  Star,
  Building,
  Phone,
  Mail,
  Eye,
  Plus,
  ChevronDown,
  Search,
  Filter,
  Home,
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  ThumbsUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { userService, businessOwnerService, socialService, messagingService, activityService } from '@/lib/database'
import { useAuth } from '@/lib/auth'
import type { UserProfile, BusinessActivity, SocialStats } from '@/lib/database'

// Profile Navigation Bar - FIXED
function ProfileNavBar({ user, isOwnProfile }: { user: any, isOwnProfile: boolean }) {
  const router = useRouter()
  
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="font-semibold text-gray-900">Profile</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Follow Button Component - FIXED
function FollowButton({ 
  targetUserId, 
  targetType, 
  className = "" 
}: { 
  targetUserId: string
  targetType: 'user' | 'business'
  className?: string 
}) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    checkFollowStatus()
  }, [targetUserId, user])

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return

    try {
      if (targetType === 'user') {
        const { data } = await socialService.isFollowing(user.id, targetUserId)
        setIsFollowing(data)
      } else {
        const { data } = await socialService.isFollowingBusiness(user.id, targetUserId)
        setIsFollowing(data)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const toggleFollow = async () => {
    if (!user || loading) return
    
    setLoading(true)
    try {
      if (targetType === 'user') {
        if (isFollowing) {
          await socialService.unfollowUser(user.id, targetUserId)
        } else {
          await socialService.followUser(user.id, targetUserId)
        }
      } else {
        if (isFollowing) {
          await socialService.unfollowBusiness(user.id, targetUserId)
        } else {
          await socialService.followBusiness(user.id, targetUserId)
        }
      }
      
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={toggleFollow}
      disabled={loading}
      className={className}
      variant={isFollowing ? "outline" : "default"}
    >
      {loading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
      ) : (
        <Users className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}

// Message Button Component - NEW
function MessageButton({ 
  targetUserId, 
  businessId, 
  className = "" 
}: { 
  targetUserId: string
  businessId?: string
  className?: string 
}) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const startConversation = async () => {
    if (!user || loading) return
    
    setLoading(true)
    try {
      const { data: conversationId, error } = await messagingService.getOrCreateConversation(
        user.id,
        targetUserId,
        businessId
      )

      if (error) {
        console.error('Error creating conversation:', error)
        return
      }

      if (conversationId) {
        router.push(`/messages?conversation=${conversationId}`)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={startConversation}
      disabled={loading}
      variant="outline"
      className={className}
    >
      {loading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent mr-2"></div>
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      Message
    </Button>
  )
}

// Simple Post Card Component - NEW
function SimplePostCard({ post }: { post: BusinessActivity }) {
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const { user } = useAuth()

  const toggleLike = async () => {
    if (!user) return

    try {
      const { data } = await activityService.togglePostLike(post.id, user.id)
      if (data) {
        setLiked(data.liked)
        setLikesCount(data.likesCount)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <img 
              src={post.user_avatar || '/default-avatar.png'} 
              alt={post.user_name || 'User'}
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900">{post.user_name || 'User'}</h4>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
        
        {post.images && post.images.length > 0 && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.images[0]} 
              alt="Post" 
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {post.location_name && (
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{post.location_name}</span>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">{post.shares_count || 0}</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Enhanced Cover & Profile Section - FIXED
function ProfileCoverSection({ 
  isOwnProfile, 
  profile,
  socialStats
}: { 
  isOwnProfile: boolean
  profile: UserProfile
  socialStats: SocialStats | null
}) {
  const { user } = useAuth()

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="relative h-64 lg:h-80 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium opacity-75">Add a cover photo</p>
          </div>
        </div>
        
        {/* Cover Photo Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {isOwnProfile && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Edit Cover
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-16 lg:-mt-20 pb-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:gap-6">
              <div className="relative mb-4 lg:mb-0 flex justify-center lg:justify-start">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-white p-2 shadow-xl">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-3xl lg:text-4xl font-bold text-blue-600">
                        {profile.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Profile Picture Edit Button */}
                {isOwnProfile && (
                  <Button 
                    size="sm" 
                    className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >
                    <Camera className="w-3 h-3" />
                  </Button>
                )}

                {/* Online Status Indicator */}
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="text-center lg:text-left lg:pb-4">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {profile.full_name || 'User'}
                  </h1>
                  {profile.is_verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                
                {/* Social Stats */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 text-gray-600 mb-3">
                  <button className="hover:underline font-semibold">
                    {socialStats?.followers_count || 0} followers
                  </button>
                  <span>•</span>
                  <button className="hover:underline font-semibold">
                    {socialStats?.following_count || 0} following
                  </button>
                  <span>•</span>
                  <button className="hover:underline font-semibold">
                    {socialStats?.posts_count || 0} posts
                  </button>
                </div>

                {/* Bio */}
                <p className="text-gray-700 max-w-md text-center lg:text-left">
                  {profile.bio || 'Local business enthusiast | Helping grow Chittorgarh\'s economy'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-6 lg:mt-0 lg:pb-4">
              {isOwnProfile ? (
                <>
                  <Button className="px-6 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                  <Button variant="outline" className="px-6">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <FollowButton
                    targetUserId={profile.id}
                    targetType="user"
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                  />
                  <MessageButton
                    targetUserId={profile.id}
                    className="px-6"
                  />
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Tabs - SIMPLIFIED
function ProfileTabs({ 
  activeTab, 
  setActiveTab, 
  userBusinesses
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  userBusinesses: any[]
}) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'Posts' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' }
  ]

  if (userBusinesses.length > 0) {
    tabs.push({ id: 'businesses', label: 'Businesses' })
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Overview Section - NEW
function OverviewSection({ 
  profile, 
  socialStats, 
  userPosts, 
  userBusinesses 
}: { 
  profile: UserProfile
  socialStats: SocialStats | null
  userPosts: BusinessActivity[]
  userBusinesses: any[]
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{socialStats?.posts_count || 0}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{socialStats?.reviews_count || 0}</div>
          <div className="text-sm text-gray-600">Reviews</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{socialStats?.followers_count || 0}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{socialStats?.businesses_following_count || 0}</div>
          <div className="text-sm text-gray-600">Following</div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.slice(0, 2).map((post) => (
              <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <p className="text-gray-900 mb-2">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>{post.likes_count} likes</span>
                  <span>{post.comments_count} comments</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </Card>

      {/* Businesses */}
      {userBusinesses.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Businesses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBusinesses.slice(0, 4).map((business) => (
              <div key={business.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{business.name}</h4>
                  <Badge variant={business.status === 'published' ? 'default' : 'secondary'}>
                    {business.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// About Section - SIMPLIFIED
function AboutSection({ profile }: { profile: UserProfile }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="font-medium text-gray-900">
                {profile.user_type === 'admin' ? 'Administrator' :
                 profile.user_type === 'business_owner' ? 'Business Owner' : 'Community Member'}
              </p>
              <p className="text-sm text-gray-600">Role in Chittor Darpan</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="font-medium text-gray-900">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600">Member since</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="font-medium text-gray-900">{profile.email}</p>
              <p className="text-sm text-gray-600">Email</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// User Businesses Section - SIMPLIFIED
function UserBusinesses({ businesses }: { businesses: any[] }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {businesses.length === 0 ? (
        <Card className="p-8 text-center">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No businesses yet</h3>
          <p className="text-gray-500">Business listings will appear here</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((business) => (
            <Card key={business.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{business.name}</h4>
                  <Badge 
                    variant={business.status === 'published' ? 'default' : 'secondary'}
                    className="mb-2"
                  >
                    {business.status}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Created {new Date(business.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Profile Component - FIXED
export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileUserId = searchParams.get('userId')
  const { user: currentUser } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<BusinessActivity[]>([])
  const [userBusinesses, setUserBusinesses] = useState<any[]>([])
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const isOwnProfile = !profileUserId || (currentUser && profileUserId === currentUser.id)
  const targetUserId = profileUserId || currentUser?.id

  useEffect(() => {
    if (targetUserId) {
      loadProfileData()
    }
  }, [targetUserId])

  const loadProfileData = async () => {
    if (!targetUserId) return

    setLoading(true)
    try {
      // Load profile
      const { data: profileData } = await userService.getUserProfile(targetUserId)
      if (profileData) {
        setProfile(profileData)
      }

      // Load user posts
      const { data: postsData } = await activityService.getUserPosts(targetUserId, currentUser?.id)
      if (postsData) {
        setUserPosts(postsData)
      }

      // Load social stats
      const { data: statsData } = await socialService.getUserSocialStats(targetUserId)
      if (statsData) {
        setSocialStats(statsData)
      }

      // Load businesses if business owner
      if (profileData?.user_type === 'business_owner' || profileData?.user_type === 'admin') {
        const { data: businessData } = await businessOwnerService.getUserBusinesses(targetUserId, true)
        if (businessData) {
          setUserBusinesses(businessData)
        }
      }

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300"></div>
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
              <div className="space-y-4">
                <div className="w-48 h-6 bg-gray-300 rounded"></div>
                <div className="w-64 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile not found</h3>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Navigation */}
      <ProfileNavBar user={currentUser} isOwnProfile={isOwnProfile} />
      
      {/* Cover Photo & Profile Header */}
      <ProfileCoverSection 
        isOwnProfile={isOwnProfile} 
        profile={profile}
        socialStats={socialStats}
      />

      {/* Profile Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userBusinesses={userBusinesses}
      />

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <OverviewSection 
            profile={profile}
            socialStats={socialStats}
            userPosts={userPosts}
            userBusinesses={userBusinesses}
          />
        )}

        {activeTab === 'posts' && (
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <SimplePostCard key={post.id} post={post} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
                <p className="text-gray-500">
                  {isOwnProfile ? "Share your first post!" : "No posts to show"}
                </p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <AboutSection profile={profile} />
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-6xl mx-auto px-4 text-center py-8">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Reviews</h3>
            <p className="text-gray-500">Reviews section coming soon</p>
          </div>
        )}

        {activeTab === 'businesses' && userBusinesses.length > 0 && (
          <UserBusinesses businesses={userBusinesses} />
        )}
      </div>
    </div>
  )
}