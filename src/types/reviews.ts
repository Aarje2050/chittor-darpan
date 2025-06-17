// src/types/reviews.ts
// Shared review types across all review components

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