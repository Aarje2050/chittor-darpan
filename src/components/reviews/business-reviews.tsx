// src/components/reviews/business-reviews.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { reviewService, businessOwnerService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Import our clean components
import ReviewStatsCard from './review-stats'
import ReviewForm from './review-form'
import EditReviewForm from './edit-review-form'
import ReviewCard from './review-card'

// Import types
import type { Review, ReviewStats } from '@/types/reviews'

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
  
  // State management
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [isBusinessOwner, setIsBusinessOwner] = useState(false)

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadReviews()
    checkBusinessOwnership()
  }, [businessId, user])

  // Listen for edit events from review cards
  useEffect(() => {
    const handleEditReview = (event: any) => {
      setEditingReview(event.detail)
    }

    window.addEventListener('editReview', handleEditReview)
    return () => window.removeEventListener('editReview', handleEditReview)
  }, [])

  // Load reviews and stats
  const loadReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load reviews and stats in parallel
      const [reviewsResult, statsResult] = await Promise.all([
        reviewService.getBusinessReviews(businessId),
        reviewService.getReviewStats(businessId)
      ])

      if (reviewsResult.error || statsResult.error) {
        throw new Error('Failed to load reviews')
      }

      // Update reviews
      const reviewsData = reviewsResult.data || []
      setReviews(reviewsData)
      
      // Update stats  
      setReviewStats(statsResult.data || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      })

      // Check if current user has already reviewed
      if (user && reviewsData.length > 0) {
        const existingReview = reviewsData.find(r => r.user_id === user.id)
        setUserReview(existingReview || null)
      } else {
        setUserReview(null)
      }

    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  // Check if current user owns this business
  const checkBusinessOwnership = async () => {
    if (!user) {
      setIsBusinessOwner(false)
      return
    }
    
    try {
      const isOwner = await businessOwnerService.isBusinessOwner(user.id, businessId)
      setIsBusinessOwner(isOwner)
    } catch (error) {
      console.error('Error checking business ownership:', error)
      setIsBusinessOwner(false)
    }
  }

  // Handle successful review submission (real-time update)
  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    setEditingReview(null)
    // Refresh reviews immediately
    loadReviews()
  }

  // Handle review update (real-time update)
  const handleReviewUpdate = () => {
    // Refresh reviews immediately
    loadReviews()
  }

  // Show loading state
  if (loading) {
    return <ReviewsSkeleton />
  }

  // Show error state
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

      {/* Add Review Button */}
      {showAddReview && user && !userReview && !showReviewForm && !editingReview && (
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
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Edit Review Form */}
      {editingReview && (
        <EditReviewForm
          review={editingReview}
          businessName={businessName}
          onSuccess={handleReviewSuccess}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {/* User's Existing Review (highlighted) */}
      {userReview && !editingReview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Your Review</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ReviewCard 
              review={userReview} 
              showUserInfo={false}
              isBusinessOwner={isBusinessOwner}
              businessName={businessName}
              onUpdate={handleReviewUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* All Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews ({reviewStats.totalReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  showUserInfo={true}
                  isBusinessOwner={isBusinessOwner}
                  businessName={businessName}
                  onUpdate={handleReviewUpdate}
                />
              ))}
            </div>
          ) : (
            <EmptyReviewsState businessName={businessName} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Empty state component
function EmptyReviewsState({ businessName }: { businessName: string }) {
  return (
    <div className="text-center py-8">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
      <p className="text-gray-600">
        Be the first to review {businessName}!
      </p>
    </div>
  )
}

// Loading skeleton component
function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
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
      
      {/* Reviews skeleton */}
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