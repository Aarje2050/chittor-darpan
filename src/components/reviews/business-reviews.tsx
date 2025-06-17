// src/components/reviews/business-reviews.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { reviewService } from '@/lib/database'
import supabase from '@/lib/supabase'


// Review Types
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

// Props interfaces
interface BusinessReviewsProps {
  businessId: string
  businessName: string
  showAddReview?: boolean
}

export default function BusinessReviews({ 
  businessId, 
  businessName, 
  showAddReview = true 
}: BusinessReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)

  useEffect(() => {
    loadReviews()
  }, [businessId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      // This will be implemented in the database service
      const { data: reviewsData, error: reviewsError } = await getBusinessReviews(businessId)
      const { data: statsData, error: statsError } = await getReviewStats(businessId)

      if (reviewsError || statsError) {
        throw new Error('Failed to load reviews')
      }

      setReviews(reviewsData || [])
      setReviewStats(statsData || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      })

      // Check if current user has already reviewed
      if (user && reviewsData) {
        const existingReview = reviewsData.find(r => r.user_id === user.id)
        setUserReview(existingReview || null)
      }

    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    loadReviews() // Refresh reviews
  }

  if (loading) {
    return <ReviewsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reviews</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadReviews}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <ReviewStatsCard stats={reviewStats} />

      {/* Add Review Section */}
      {showAddReview && user && !userReview && !showReviewForm && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-2">Share Your Experience</h3>
              <p className="text-gray-600 text-sm mb-4">
                Help others by reviewing {businessName}
              </p>
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          businessId={businessId}
          businessName={businessName}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* User's Existing Review */}
      {userReview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Your Review</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ReviewCard review={userReview} showUserInfo={false} />
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews ({reviewStats.totalReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} showUserInfo={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">
                Be the first to review {businessName}!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Review Stats Card Component
function ReviewStatsCard({ stats }: { stats: ReviewStats }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              <StarRating rating={stats.averageRating} size="lg" />
            </div>
            <p className="text-gray-600 text-sm">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Review Form Component
interface ReviewFormProps {
  businessId: string
  businessName: string
  onSubmitted: () => void
  onCancel: () => void
}

function ReviewForm({ businessId, businessName, onSubmitted, onCancel }: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!formData.content.trim()) {
      setError('Please write a review')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // This will be implemented in the database service
      const { success, error: submitError } = await submitReview(businessId, formData)

      if (!success) {
        throw new Error(submitError || 'Failed to submit review')
      }

      onSubmitted()
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review for {businessName}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating }))}
                  className="touch-manipulation"
                >
                  <svg 
                    className={`w-8 h-8 transition-colors ${
                      rating <= formData.rating 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your experience with others..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.content.length}/500 characters
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Individual Review Card Component
interface ReviewCardProps {
  review: Review
  showUserInfo: boolean
}

function ReviewCard({ review, showUserInfo }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {showUserInfo && (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {(review.user_name || review.user_email || 'Anonymous').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            {showUserInfo && (
              <div className="font-medium text-gray-900 text-sm">
                {review.user_name || 'Anonymous User'}
              </div>
            )}
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500">
                {formatDate(review.created_at)}
              </span>
              {review.is_verified && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Content */}
      {review.title && (
        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      )}
      
      {review.content && (
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {review.content}
        </p>
      )}

      {/* Business Reply */}
      {review.reply && (
        <div className="mt-4 ml-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium text-blue-800 text-sm">Business Response</span>
            <span className="text-xs text-gray-500">
              {formatDate(review.reply.created_at)}
            </span>
          </div>
          <p className="text-gray-700 text-sm">{review.reply.content}</p>
        </div>
      )}
    </div>
  )
}

// Star Rating Component
interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
}

function StarRating({ rating, size = 'md', showNumber = false }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}

// Loading Skeleton
function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Placeholder functions that will be implemented in database service
async function getBusinessReviews(businessId: string) {
    return reviewService.getBusinessReviews(businessId)
  }

  async function getReviewStats(businessId: string) {
    return reviewService.getReviewStats(businessId)
  }

  async function submitReview(businessId: string, reviewData: ReviewFormData) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Please sign in to submit a review' }
    }
    
    return reviewService.submitReview(businessId, user.id, reviewData)
  }