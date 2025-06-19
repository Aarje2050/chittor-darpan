// src/lib/services/user.ts - User Service Layer
import { supabase } from '../supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  user_type: 'user' | 'business_owner' | 'admin'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserStats {
  reviewsCount: number
  businessesCount: number
  joinDate: string
  profileCompletion: number
}

export interface UserActivityItem {
  id: string
  type: 'review' | 'business' | 'reply'
  title: string
  description: string
  date: string
  link?: string
}

export interface ProfileUpdateData {
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
}

// User Service
export const userService = {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserProfile:', error)
      return { data: null, error }
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in updateProfile:', error)
      return { data: null, error }
    }
  },

  /**
   * Upload and update user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<{ data: string | null; error: any }> {
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { data: null, error: 'Image must be less than 5MB' }
      }

      if (!file.type.startsWith('image/')) {
        return { data: null, error: 'Please select an image file' }
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return { data: null, error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await this.updateProfile(userId, {
        avatar_url: urlData.publicUrl
      })

      if (updateError) {
        return { data: null, error: 'Failed to update profile picture' }
      }

      return { data: urlData.publicUrl, error: null }

    } catch (error) {
      console.error('Unexpected error in uploadAvatar:', error)
      return { data: null, error: 'Failed to upload profile picture' }
    }
  },

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{ data: UserStats | null; error: any }> {
    try {
      // Get user profile for join date
      const { data: profile } = await this.getUserProfile(userId)
      
      // Get reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'published')

      // Get businesses count (if user is business owner)
      const { count: businessesCount } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)

      // Calculate profile completion
      const profileCompletion = this.calculateProfileCompletion(profile)

      const stats: UserStats = {
        reviewsCount: reviewsCount || 0,
        businessesCount: businessesCount || 0,
        joinDate: profile?.created_at || new Date().toISOString(),
        profileCompletion
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile: UserProfile | null): number {
    if (!profile) return 0
    
    let completed = 0
    let total = 4
    
    if (profile.full_name) completed++
    if (profile.email) completed++
    if (profile.phone) completed++
    if (profile.avatar_url) completed++
    
    return Math.round((completed / total) * 100)
  },

  /**
   * Get user activity feed (unified across all review types)
   */
  async getUserActivity(userId: string, limit: number = 10): Promise<{ data: UserActivityItem[] | null; error: any }> {
    try {
      const activities: UserActivityItem[] = []

      // Get business reviews
      const { data: businessReviews } = await supabase
        .from('reviews')
        .select(`
          id, 
          title, 
          rating, 
          created_at,
          businesses:business_id(name, slug)
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)

      if (businessReviews) {
        businessReviews.forEach(review => {
          activities.push({
            id: `business-review-${review.id}`,
            type: 'review',
            title: `Reviewed ${review.businesses?.[0]?.name}`,
            description: `Gave ${review.rating} star${review.rating !== 1 ? 's' : ''} rating`,
            date: review.created_at,
            link: review.businesses?.length ? `/business/${review.businesses[0].slug}` : undefined
          })
        })
      }

      // Get tourism reviews
      const { data: tourismReviews } = await supabase
        .from('tourism_reviews')
        .select(`
          id, 
          title, 
          rating, 
          created_at,
          tourism_places:tourism_place_id(name, slug)
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)

      if (tourismReviews) {
        tourismReviews.forEach(review => {
          activities.push({
            id: `tourism-review-${review.id}`,
            type: 'review',
            title: `Reviewed ${review.tourism_places?.[0]?.name}`,
            description: `Tourism review - ${review.rating} star${review.rating !== 1 ? 's' : ''}`,
            date: review.created_at,
            link: `/tourism/${review.tourism_places?.[0]?.slug}`
          })
        })
      }

      // Get recent businesses (if business owner)
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, slug, created_at, status')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (businesses) {
        businesses.forEach(business => {
          activities.push({
            id: `business-${business.id}`,
            type: 'business',
            title: `Added ${business.name}`,
            description: `Business listing ${business.status}`,
            date: business.created_at,
            link: business.status === 'published' ? `/business/${business.slug}` : undefined
          })
        })
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return { data: activities.slice(0, limit), error: null }

    } catch (error) {
      console.error('Unexpected error in getUserActivity:', error)
      return { data: null, error }
    }
  },

  /**
   * Update user role (admin function)
   */
  async updateUserRole(userId: string, userType: 'user' | 'business_owner' | 'admin'): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: userType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateUserRole:', error)
      return { success: false, error }
    }
  },

  /**
   * Get current user role (for auth.tsx compatibility)
   */
  async getCurrentUserRole(userId: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data: profile, error } = await this.getUserProfile(userId)

      if (error || !profile) {
        return { data: null, error }
      }

      return { data: profile.user_type, error: null }

    } catch (error) {
      console.error('Unexpected error in getCurrentUserRole:', error)
      return { data: null, error }
    }
  },

  /**
   * Get user count (backward compatibility alias)
   */
  async getCount(): Promise<{ data: number | null; error: any }> {
    return this.getUserCount()
  },
  async getUserCount(): Promise<{ data: number | null; error: any }> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.error('Error getting user count:', error)
        return { data: null, error }
      }

      return { data: count || 0, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserCount:', error)
      return { data: null, error }
    }
  },

  /**
   * Get all users (admin function)
   */
  async getUsers(filters: {
    userType?: 'all' | 'user' | 'business_owner' | 'admin'
    search?: string
    limit?: number
  } = {}): Promise<{ data: UserProfile[] | null; error: any }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.userType && filters.userType !== 'all') {
        query = query.eq('user_type', filters.userType)
      }

      if (filters.search?.trim()) {
        query = query.or(`full_name.ilike.%${filters.search.trim()}%,email.ilike.%${filters.search.trim()}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getUsers:', error)
      return { data: null, error }
    }
  },

  /**
   * Check if user exists and create profile if needed
   */
  async ensureUserProfile(userId: string, userData: {
    email: string
    full_name?: string
    avatar_url?: string
  }): Promise<{ data: UserProfile | null; error: any }> {
    try {
      // Try to get existing profile
      const { data: existingProfile } = await this.getUserProfile(userId)
      
      if (existingProfile) {
        // Update avatar from Google if user doesn't have one
        if (!existingProfile.avatar_url && userData.avatar_url) {
          const { data: updatedProfile } = await this.updateProfile(userId, {
            avatar_url: userData.avatar_url
          })
          return { data: updatedProfile, error: null }
        }
        return { data: existingProfile, error: null }
      }

      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: userData.email,
            full_name: userData.full_name || null,
            avatar_url: userData.avatar_url || null,
            user_type: 'user'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in ensureUserProfile:', error)
      return { data: null, error }
    }
  }
}