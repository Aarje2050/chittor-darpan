// src/lib/services/reviews.ts - Fixed Review Service (Simple & Robust)
import { supabase } from '../supabase'

export interface Review {
  id: string
  business_id: string
  user_id: string
  rating: number
  title: string | null
  content: string | null
  status: 'pending' | 'published' | 'rejected'
  is_verified: boolean
  created_at: string
  updated_at: string
  edit_count: number
  edited_at: string | null
  is_deleted: boolean
  // Related data
  user_name?: string
  user_email?: string
  reply?: ReviewReply | null
}

export interface ReviewReply {
  id: string
  review_id: string
  business_id: string
  content: string
  replied_by: string
  created_at: string
  updated_at: string
  replier_name?: string
}

export interface ReviewFormData {
  rating: number
  title: string
  content: string
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

// Helper function to execute SQL with fallback
async function executeReviewQuery(query: string, params: any[] = []) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query,
      params: params
    })
    return { data, error }
  } catch (error) {
    console.error('SQL execution failed:', error)
    return { data: null, error }
  }
}

// Fixed Review Service - Simple and Robust
export const reviewService = {
  /**
   * Get reviews for a business - SIMPLIFIED APPROACH
   */
  async getBusinessReviews(businessId: string): Promise<{ data: Review[] | null; error: any }> {
    try {
      console.log('📖 Loading reviews for business:', businessId)

      // Try the public view first (most reliable)
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('business_id', businessId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching reviews:', error)
        return { data: null, error }
      }

      console.log('✅ Found reviews:', data?.length || 0)

      // Get review replies
      const reviewIds = (data || []).map(r => r.id)
      let replies: any[] = []
      
      if (reviewIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('review_replies')
          .select(`
            *,
            profiles:replied_by(full_name)
          `)
          .in('review_id', reviewIds)
        
        replies = repliesData || []
      }

      // Transform data
      const reviews: Review[] = (data || []).map(item => {
        const reply = replies.find(r => r.review_id === item.id)
        
        return {
          ...item,
          user_name: item.profiles?.full_name || null,
          user_email: item.profiles?.email || null,
          reply: reply ? {
            ...reply,
            replier_name: reply.profiles?.full_name || null
          } : null
        }
      })

      return { data: reviews, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getBusinessReviews:', error)
      return { data: null, error }
    }
  },

  /**
   * Submit a new review - BACK TO PUBLIC VIEW (like tourism)
   */
  async submitReview(
    businessId: string, 
    userId: string, 
    reviewData: ReviewFormData
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('📝 Submitting review for business:', businessId, 'by user:', userId)

      // Check existing review using public view (like tourism)
      const { data: existingReviews, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', userId)

      if (checkError) {
        console.error('❌ Error checking existing review:', checkError)
        // Continue anyway - let database constraints handle duplicates
      }

      if (existingReviews && existingReviews.length > 0) {
        console.log('⚠️ User already has a review for this business')
        return { success: false, error: 'You have already reviewed this business' }
      }

      // Insert new review using PUBLIC VIEW (like tourism does)
      const reviewPayload = {
        business_id: businessId,
        user_id: userId,
        rating: reviewData.rating,
        title: reviewData.title.trim() || null,
        content: reviewData.content.trim(),
        status: 'published' as const,
        is_verified: false,
        edit_count: 0,
        is_deleted: false
      }

      console.log('📤 Inserting review into public view (like tourism):', reviewPayload)

      // Use public view like tourism does
      const { data: insertedReview, error: insertError } = await supabase
        .from('reviews')
        .insert([reviewPayload])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error inserting review:', insertError)
        
        // Handle specific duplicate error
        if (insertError.code === '23505') {
          return { success: false, error: 'You have already reviewed this business' }
        }
        
        return { success: false, error: 'Failed to submit review' }
      }

      console.log('✅ Review submitted successfully:', insertedReview)
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in submitReview:', error)
      return { success: false, error: 'Failed to submit review' }
    }
  },

  /**
   * Get review statistics - SIMPLIFIED
   */
  async getReviewStats(businessId: string): Promise<{ data: ReviewStats | null; error: any }> {
    try {
      console.log('📊 Loading review stats for business:', businessId)

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('business_id', businessId)
        .eq('status', 'published')

      if (error) {
        console.error('❌ Error fetching review stats:', error)
        return { data: null, error }
      }

      const reviews = data || []
      const totalReviews = reviews.length

      if (totalReviews === 0) {
        return {
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          error: null
        }
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / totalReviews

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++
      })

      const stats: ReviewStats = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }

      console.log('✅ Review stats loaded:', stats)
      return { data: stats, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getReviewStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Add business reply to review - USE PUBLIC VIEW (like tourism)
   */
  async addReviewReply(
    reviewId: string,
    businessId: string,
    replierId: string,
    content: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('💬 Adding reply to review:', reviewId)

      // Check existing reply using public view
      const { data: existingReply, error: checkError } = await supabase
        .from('review_replies')
        .select('id')
        .eq('review_id', reviewId)
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking existing reply:', checkError)
      }

      if (existingReply) {
        return { success: false, error: 'Reply already exists for this review' }
      }

      // Insert reply using public view
      const { data: insertedReply, error: insertError } = await supabase
        .from('review_replies')
        .insert([
          {
            review_id: reviewId,
            business_id: businessId,
            replied_by: replierId,
            content: content.trim()
          }
        ])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error inserting review reply:', insertError)
        return { success: false, error: 'Failed to add reply' }
      }

      console.log('✅ Reply added successfully:', insertedReply)
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in addReviewReply:', error)
      return { success: false, error: 'Failed to add reply' }
    }
  },

  /**
   * Update an existing review - USE PUBLIC VIEW (like tourism)
   */
  async updateReview(
    reviewId: string,
    userId: string,
    reviewData: ReviewFormData
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('✏️ Updating review:', reviewId)

      // Get current review using public view
      const { data: currentReview, error: fetchError } = await supabase
        .from('reviews')
        .select('edit_count, user_id')
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching current review:', fetchError)
        return { success: false, error: 'Review not found' }
      }

      if (currentReview.user_id !== userId) {
        return { success: false, error: 'You can only edit your own reviews' }
      }

      if (currentReview.edit_count >= 2) {
        return { success: false, error: 'You have reached the maximum edit limit (2 edits)' }
      }

      // Update review using public view
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          rating: reviewData.rating,
          title: reviewData.title.trim() || null,
          content: reviewData.content.trim(),
          edit_count: currentReview.edit_count + 1,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (updateError) {
        console.error('❌ Error updating review:', updateError)
        return { success: false, error: 'Failed to update review' }
      }

      console.log('✅ Review updated successfully')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in updateReview:', error)
      return { success: false, error: 'Failed to update review' }
    }
  },

  /**
   * Soft delete a review - USE PUBLIC VIEW (like tourism)
   */
  async deleteReview(
    reviewId: string,
    userId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🗑️ Deleting review:', reviewId)

      // Get current review using public view
      const { data: currentReview, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching current review:', fetchError)
        return { success: false, error: 'Review not found' }
      }

      if (currentReview.user_id !== userId) {
        return { success: false, error: 'You can only delete your own reviews' }
      }

      // Soft delete using public view
      const { error: deleteError } = await supabase
        .from('reviews')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (deleteError) {
        console.error('❌ Error deleting review:', deleteError)
        return { success: false, error: 'Failed to delete review' }
      }

      console.log('✅ Review deleted successfully')
      return { success: true, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in deleteReview:', error)
      return { success: false, error: 'Failed to delete review' }
    }
  }
}