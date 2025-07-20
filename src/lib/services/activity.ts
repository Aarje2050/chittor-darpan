// src/lib/services/activity.ts - Clean Activity Service for User & Business Activities
import { supabase } from '../supabase'

// Types for activity service
export interface UserActivity {
  id: string
  user_id: string
  activity_type: 'post_created' | 'review_written' | 'business_followed' | 'user_followed' | 'business_shared' | 'post_liked'
  source_type: 'post' | 'review' | 'tourism_review' | 'business' | 'user_follow' | 'business_follow'
  source_id: string
  title: string
  description: string | null
  image_url: string | null
  target_user_id: string | null
  target_business_id: string | null
  created_at: string
  
  // Related data
  user_name?: string
  user_avatar?: string
  business_name?: string
  business_logo?: string
}

export interface BusinessActivity {
  id: string
  user_id: string
  business_id: string | null
  content: string
  images: string[] | null
  post_type: 'user_post' | 'business_update' | 'review_share' | 'business_share' | 'tourism_share'
  source_type: string | null
  source_id: string | null
  location_name: string | null
  latitude: number | null
  longitude: number | null
  likes_count: number
  comments_count: number
  shares_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Related data
  user_name?: string
  user_avatar?: string
  business_name?: string
  business_logo?: string
  is_liked?: boolean
}

export interface ActivityFilters {
  user_id?: string
  business_id?: string
  activity_type?: string
  limit?: number
  offset?: number
}

export interface ActivityCreateData {
  content: string
  images?: string[]
  location_name?: string
  latitude?: number
  longitude?: number
  business_id?: string
}

// Activity Service
export const activityService = {
  /**
   * Get user's activity timeline (their posts + followed businesses)
   */
  async getUserTimeline(userId: string, limit: number = 20): Promise<{ data: BusinessActivity[] | null; error: any }> {
    try {
      console.log('📰 Loading user timeline for:', userId)

      // Get user's following list for businesses
      const { data: businessFollows } = await supabase
        .from('business_follows')
        .select('business_id')
        .eq('user_id', userId)

      const followedBusinessIds = businessFollows?.map(f => f.business_id) || []

      // Get user's followed users
      const { data: userFollows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'accepted')

      const followedUserIds = userFollows?.map(f => f.following_id) || []

      // Include user's own posts
      const allUserIds = [userId, ...followedUserIds]

      // Get posts from followed users and businesses
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          businesses:business_id(name, logo_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter by followed users or business owners
      if (followedBusinessIds.length > 0 || allUserIds.length > 0) {
        query = query.or(`user_id.in.(${allUserIds.join(',')}),business_id.in.(${followedBusinessIds.join(',')})`)
      } else {
        // If no follows, show only user's own posts
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error loading timeline:', error)
        return { data: null, error }
      }

      // Check which posts user has liked
      const postIds = data?.map(post => post.id) || []
      let likedPostIds = new Set<string>()

      if (postIds.length > 0) {
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds)

        likedPostIds = new Set(userLikes?.map(like => like.post_id) || [])
      }

      // Transform data
      const activities: BusinessActivity[] = (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.full_name || 'User',
        user_avatar: item.profiles?.avatar_url || null,
        business_name: item.businesses?.name || null,
        business_logo: item.businesses?.logo_url || null,
        is_liked: likedPostIds.has(item.id)
      }))

      console.log(`✅ Loaded ${activities.length} timeline activities`)
      return { data: activities, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserTimeline:', error)
      return { data: null, error }
    }
  },

  /**
   * Get user's own posts
   */
  async getUserPosts(userId: string, viewerId?: string): Promise<{ data: BusinessActivity[] | null; error: any }> {
    try {
      console.log('👤 Loading posts for user:', userId)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          businesses:business_id(name, logo_url)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading user posts:', error)
        return { data: null, error }
      }

      // Check likes if viewer provided
      let likedPostIds = new Set<string>()
      if (viewerId && data && data.length > 0) {
        const postIds = data.map(post => post.id)
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', viewerId)
          .in('post_id', postIds)

        likedPostIds = new Set(userLikes?.map(like => like.post_id) || [])
      }

      const posts: BusinessActivity[] = (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.full_name || 'User',
        user_avatar: item.profiles?.avatar_url || null,
        business_name: item.businesses?.name || null,
        business_logo: item.businesses?.logo_url || null,
        is_liked: likedPostIds.has(item.id)
      }))

      console.log(`✅ Loaded ${posts.length} user posts`)
      return { data: posts, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserPosts:', error)
      return { data: null, error }
    }
  },

  /**
   * Get business activities
   */
  async getBusinessPosts(businessId: string, viewerId?: string): Promise<{ data: BusinessActivity[] | null; error: any }> {
    try {
      console.log('🏢 Loading posts for business:', businessId)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          businesses:business_id(name, logo_url)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading business posts:', error)
        return { data: null, error }
      }

      // Check likes if viewer provided
      let likedPostIds = new Set<string>()
      if (viewerId && data && data.length > 0) {
        const postIds = data.map(post => post.id)
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', viewerId)
          .in('post_id', postIds)

        likedPostIds = new Set(userLikes?.map(like => like.post_id) || [])
      }

      const posts: BusinessActivity[] = (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.full_name || 'User',
        user_avatar: item.profiles?.avatar_url || null,
        business_name: item.businesses?.name || null,
        business_logo: item.businesses?.logo_url || null,
        is_liked: likedPostIds.has(item.id)
      }))

      console.log(`✅ Loaded ${posts.length} business posts`)
      return { data: posts, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getBusinessPosts:', error)
      return { data: null, error }
    }
  },

  /**
   * Create a new post
   */
  async createPost(userId: string, postData: ActivityCreateData): Promise<{ data: BusinessActivity | null; error: any }> {
    try {
      console.log('📝 Creating post for user:', userId)

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: userId,
            business_id: postData.business_id || null,
            content: postData.content.trim(),
            images: postData.images && postData.images.length > 0 ? postData.images : null,
            post_type: postData.business_id ? 'business_update' : 'user_post',
            location_name: postData.location_name || null,
            latitude: postData.latitude || null,
            longitude: postData.longitude || null
          }
        ])
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          businesses:business_id(name, logo_url)
        `)
        .single()

      if (error) {
        console.error('❌ Error creating post:', error)
        return { data: null, error }
      }

      const post: BusinessActivity = {
        ...data,
        user_name: data.profiles?.full_name || 'User',
        user_avatar: data.profiles?.avatar_url || null,
        business_name: data.businesses?.name || null,
        business_logo: data.businesses?.logo_url || null,
        is_liked: false
      }

      console.log('✅ Post created successfully')
      return { data: post, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in createPost:', error)
      return { data: null, error }
    }
  },

  /**
   * Like/unlike a post
   */
  async togglePostLike(postId: string, userId: string): Promise<{ data: { liked: boolean; likesCount: number } | null; error: any }> {
    try {
      console.log('❤️ Toggling like for post:', postId)

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        if (deleteError) {
          return { data: null, error: deleteError }
        }
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }])

        if (insertError) {
          return { data: null, error: insertError }
        }
      }

      // Get updated likes count
      const { data: post } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single()

      return { 
        data: { 
          liked: !existingLike, 
          likesCount: post?.likes_count || 0 
        }, 
        error: null 
      }

    } catch (error) {
      console.error('💥 Unexpected error in togglePostLike:', error)
      return { data: null, error }
    }
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🗑️ Deleting post:', postId)

      const { error } = await supabase
        .from('posts')
        .update({ is_active: false })
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Error deleting post:', error)
        return { success: false, error }
      }

      console.log('✅ Post deleted successfully')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in deletePost:', error)
      return { success: false, error }
    }
  },

  /**
   * Get user activity history (for activity tab)
   */
  async getUserActivityHistory(userId: string): Promise<{ data: UserActivity[] | null; error: any }> {
    try {
      console.log('📊 Loading user activity history for:', userId)

      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          target_user:target_user_id(full_name, avatar_url),
          target_business:target_business_id(name, logo_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Error loading activity history:', error)
        return { data: null, error }
      }

      const activities: UserActivity[] = (data || []).map(item => ({
        ...item,
        business_name: item.target_business?.name || null,
        business_logo: item.target_business?.logo_url || null
      }))

      console.log(`✅ Loaded ${activities.length} activity items`)
      return { data: activities, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getUserActivityHistory:', error)
      return { data: null, error }
    }
  }
}