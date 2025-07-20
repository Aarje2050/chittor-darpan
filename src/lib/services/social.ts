// src/lib/services/social.ts - Clean Social Service for Following/Followers
import { supabase } from '../supabase'

// Types for social services
export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Related data
  follower_name?: string
  follower_avatar?: string
  following_name?: string
  following_avatar?: string
}

export interface BusinessFollow {
  id: string
  user_id: string
  business_id: string
  created_at: string
  // Related data
  business_name?: string
  business_slug?: string
  business_logo?: string
}

export interface SocialStats {
  followers_count: number
  following_count: number
  businesses_following_count: number
  posts_count: number
  reviews_count: number
}

export interface FollowSuggestion {
  id: string
  full_name: string
  avatar_url: string | null
  mutual_followers: number
  is_following: boolean
  recent_activity?: string
}

// Social Service - Following and social features
export const socialService = {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('👥 Following user:', followingId)

      // Check if already following
      const { data: existing } = await supabase
        .from('user_follows')
        .select('id, status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already following this user' }
        }
        if (existing.status === 'pending') {
          return { success: false, error: 'Follow request already sent' }
        }
      }

      const { error } = await supabase
        .from('user_follows')
        .upsert([
          {
            follower_id: followerId,
            following_id: followingId,
            status: 'accepted' // For now, auto-accept. Can change to 'pending' later
          }
        ])

      if (error) {
        console.error('❌ Error following user:', error)
        return { success: false, error }
      }

      console.log('✅ User followed successfully')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in followUser:', error)
      return { success: false, error }
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('👥 Unfollowing user:', followingId)

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      if (error) {
        console.error('❌ Error unfollowing user:', error)
        return { success: false, error }
      }

      console.log('✅ User unfollowed')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in unfollowUser:', error)
      return { success: false, error }
    }
  },

  /**
   * Follow a business
   */
  async followBusiness(userId: string, businessId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🏢 Following business:', businessId)

      const { error } = await supabase
        .from('business_follows')
        .upsert([
          {
            user_id: userId,
            business_id: businessId
          }
        ])

      if (error) {
        console.error('❌ Error following business:', error)
        return { success: false, error }
      }

      console.log('✅ Business followed')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in followBusiness:', error)
      return { success: false, error }
    }
  },

  /**
   * Unfollow a business
   */
  async unfollowBusiness(userId: string, businessId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🏢 Unfollowing business:', businessId)

      const { error } = await supabase
        .from('business_follows')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', businessId)

      if (error) {
        console.error('❌ Error unfollowing business:', error)
        return { success: false, error }
      }

      console.log('✅ Business unfollowed')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in unfollowBusiness:', error)
      return { success: false, error }
    }
  },

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: string): Promise<{ data: UserFollow[] | null; error: any }> {
    try {
      console.log('👥 Getting followers for user:', userId)

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:follower_id(full_name, avatar_url)
        `)
        .eq('following_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error getting followers:', error)
        return { data: null, error }
      }

      const followers = (data || []).map(item => ({
        ...item,
        follower_name: item.follower?.full_name || null,
        follower_avatar: item.follower?.avatar_url || null
      }))

      console.log(`✅ Found ${followers.length} followers`)
      return { data: followers, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserFollowers:', error)
      return { data: null, error }
    }
  },

  /**
   * Get user's following
   */
  async getUserFollowing(userId: string): Promise<{ data: UserFollow[] | null; error: any }> {
    try {
      console.log('👥 Getting following for user:', userId)

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:following_id(full_name, avatar_url)
        `)
        .eq('follower_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error getting following:', error)
        return { data: null, error }
      }

      const following = (data || []).map(item => ({
        ...item,
        following_name: item.following?.full_name || null,
        following_avatar: item.following?.avatar_url || null
      }))

      console.log(`✅ Found ${following.length} following`)
      return { data: following, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserFollowing:', error)
      return { data: null, error }
    }
  },

  /**
   * Get user's business follows
   */
  async getUserBusinessFollows(userId: string): Promise<{ data: BusinessFollow[] | null; error: any }> {
    try {
      console.log('🏢 Getting business follows for user:', userId)

      const { data, error } = await supabase
        .from('business_follows')
        .select(`
          *,
          business:business_id(name, slug, logo_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error getting business follows:', error)
        return { data: null, error }
      }

      const businessFollows = (data || []).map(item => ({
        ...item,
        business_name: item.business?.name || null,
        business_slug: item.business?.slug || null,
        business_logo: item.business?.logo_url || null
      }))

      console.log(`✅ Found ${businessFollows.length} business follows`)
      return { data: businessFollows, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserBusinessFollows:', error)
      return { data: null, error }
    }
  },

  /**
   * Get social stats for user
   */
  async getUserSocialStats(userId: string): Promise<{ data: SocialStats | null; error: any }> {
    try {
      console.log('📊 Getting social stats for user:', userId)

      const [followersResult, followingResult, businessFollowsResult, postsResult, reviewsResult] = await Promise.all([
        // Count followers
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId)
          .eq('status', 'accepted'),
        
        // Count following
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId)
          .eq('status', 'accepted'),
        
        // Count business follows
        supabase
          .from('business_follows')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Count posts
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true),
        
        // Count reviews
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'published')
      ])

      const stats: SocialStats = {
        followers_count: followersResult.count || 0,
        following_count: followingResult.count || 0,
        businesses_following_count: businessFollowsResult.count || 0,
        posts_count: postsResult.count || 0,
        reviews_count: reviewsResult.count || 0
      }

      console.log('✅ Social stats loaded:', stats)
      return { data: stats, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserSocialStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<{ data: boolean; status: string | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error checking follow status:', error)
        return { data: false, status: null, error }
      }

      return { 
        data: data?.status === 'accepted',
        status: data?.status || null,
        error: null 
      }

    } catch (error) {
      console.error('💥 Unexpected error in isFollowing:', error)
      return { data: false, status: null, error }
    }
  },

  /**
   * Check if user is following business
   */
  async isFollowingBusiness(userId: string, businessId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .from('business_follows')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error checking business follow status:', error)
        return { data: false, error }
      }

      return { data: !!data, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in isFollowingBusiness:', error)
      return { data: false, error }
    }
  },

  /**
   * Get business followers count
   */
  async getBusinessFollowersCount(businessId: string): Promise<{ data: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('business_follows')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)

      if (error) {
        console.error('❌ Error getting business followers count:', error)
        return { data: 0, error }
      }

      return { data: count || 0, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getBusinessFollowersCount:', error)
      return { data: 0, error }
    }
  },

  /**
   * Get follow suggestions for user
   */
  async getFollowSuggestions(userId: string, limit: number = 5): Promise<{ data: FollowSuggestion[] | null; error: any }> {
    try {
      console.log('🔍 Getting follow suggestions for user:', userId)

      // Get users who are not being followed by current user
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', userId)
        .limit(limit * 2) // Get more to filter out already followed

      if (error) {
        console.error('❌ Error getting follow suggestions:', error)
        return { data: null, error }
      }

      // Get current user's following list
      const { data: currentFollowing } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'accepted')

      const followingIds = new Set(currentFollowing?.map(f => f.following_id) || [])

      // Filter out already followed users
      const suggestions: FollowSuggestion[] = (data || [])
        .filter(user => !followingIds.has(user.id))
        .slice(0, limit)
        .map(user => ({
          id: user.id,
          full_name: user.full_name || 'User',
          avatar_url: user.avatar_url,
          mutual_followers: 0, // Could calculate this later
          is_following: false
        }))

      console.log(`✅ Found ${suggestions.length} follow suggestions`)
      return { data: suggestions, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getFollowSuggestions:', error)
      return { data: null, error }
    }
  }
}