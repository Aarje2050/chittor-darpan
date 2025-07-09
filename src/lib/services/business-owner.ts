// src/lib/services/business-owner.ts - Business Owner Service Layer
import { supabase } from '../supabase'

export interface UserBusiness {
  id: string
  name: string
  slug: string
  status: 'pending' | 'published' | 'rejected' | 'suspended'
  created_at: string
  updated_at: string
}

export interface BusinessOwnerPermissions {
  canEdit: boolean
  canDelete: boolean
  canManageReviews: boolean
  canViewAnalytics: boolean
}

// Business Owner Service - For business ownership and permissions
export const businessOwnerService = {
  /**
   * Check if user owns a specific business
   */
  async isBusinessOwner(userId: string, businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()
      
      if (error || !data) {
        console.error('Error checking business ownership:', error)
        return false
      }
      
      return data.owner_id === userId
    } catch (error) {
      console.error('Error checking business ownership:', error)
      return false
    }
  },

  /**
   * Get businesses owned by user
   */
  async getUserBusinesses(userId: string, includeAll: boolean = false): Promise<{ data: UserBusiness[] | null; error: any }> {
    try {
      let query = supabase
        .from('businesses')
        .select('id, name, slug, status, created_at, updated_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      // By default, only return published businesses unless includeAll is true
      if (!includeAll) {
        query = query.eq('status', 'published')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user businesses:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getUserBusinesses:', error)
      return { data: null, error }
    }
  },

  /**
   * Get business ownership permissions for a user
   */
  async getBusinessPermissions(userId: string, businessId: string): Promise<{ data: BusinessOwnerPermissions | null; error: any }> {
    try {
      // Check if user owns the business
      const isOwner = await this.isBusinessOwner(userId, businessId)
      
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

      const isAdmin = userProfile?.user_type === 'admin'

      // Define permissions based on ownership and role
      const permissions: BusinessOwnerPermissions = {
        canEdit: isOwner || isAdmin,
        canDelete: isAdmin, // Only admins can delete
        canManageReviews: isOwner || isAdmin,
        canViewAnalytics: isOwner || isAdmin
      }

      return { data: permissions, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessPermissions:', error)
      return { data: null, error }
    }
  },

  /**
   * Get business count for user
   */
  async getUserBusinessCount(userId: string, status?: string): Promise<{ data: number | null; error: any }> {
    try {
      let query = supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error fetching user business count:', error)
        return { data: null, error }
      }

      return { data: count || 0, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserBusinessCount:', error)
      return { data: null, error }
    }
  },

  /**
   * Check if user can create more businesses (if you have limits)
   */
  async canCreateBusiness(userId: string, maxBusinesses: number = 10): Promise<{ data: boolean; error: any }> {
    try {
      const { data: count, error } = await this.getUserBusinessCount(userId)

      if (error) {
        return { data: false, error }
      }

      return { data: (count || 0) < maxBusinesses, error: null }

    } catch (error) {
      console.error('Unexpected error in canCreateBusiness:', error)
      return { data: false, error }
    }
  },

  /**
   * Transfer business ownership (admin function)
   */
  async transferOwnership(businessId: string, newOwnerId: string, adminId: string): Promise<{ success: boolean; error: any }> {
    try {
      // Verify admin permissions
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', adminId)
        .single()

      if (adminProfile?.user_type !== 'admin') {
        return { success: false, error: 'Only admins can transfer ownership' }
      }

      // Verify new owner exists
      const { data: newOwner } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', newOwnerId)
        .single()

      if (!newOwner) {
        return { success: false, error: 'New owner not found' }
      }

      // Update business ownership
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          owner_id: newOwnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)

      if (updateError) {
        console.error('Error transferring ownership:', updateError)
        return { success: false, error: updateError }
      }

      // Promote new owner to business_owner role if they're just a user
      if (newOwner.user_type === 'user') {
        await supabase
          .from('profiles')
          .update({ user_type: 'business_owner' })
          .eq('id', newOwnerId)
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in transferOwnership:', error)
      return { success: false, error }
    }
  },

  /**
   * Get business owner dashboard stats
   */
  async getOwnerDashboardStats(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      // Get business counts by status
      const [totalResult, publishedResult, pendingResult, rejectedResult] = await Promise.all([
        this.getUserBusinessCount(userId),
        this.getUserBusinessCount(userId, 'published'),
        this.getUserBusinessCount(userId, 'pending'),
        this.getUserBusinessCount(userId, 'rejected')
      ])

      // Get recent reviews for user's businesses
      const { data: businesses } = await this.getUserBusinesses(userId, true)
      
      let totalReviews = 0
      let averageRating = 0

      if (businesses && businesses.length > 0) {
        const businessIds = businesses.map(b => b.id)
        
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('business_id', businessIds)
          .eq('status', 'published')

        if (reviews && reviews.length > 0) {
          totalReviews = reviews.length
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
          averageRating = Math.round((totalRating / totalReviews) * 10) / 10
        }
      }

      const stats = {
        businessCounts: {
          total: totalResult.data || 0,
          published: publishedResult.data || 0,
          pending: pendingResult.data || 0,
          rejected: rejectedResult.data || 0
        },
        reviewStats: {
          totalReviews,
          averageRating
        },
        businesses: businesses || []
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('Unexpected error in getOwnerDashboardStats:', error)
      return { data: null, error }
    }
  }
}