// src/components/reviews/review-card.tsx

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { reviewService } from '@/lib/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StarRating from './star-rating'
import type { Review } from '@/types/reviews'
import ReviewReplyForm from './review-reply-form'

interface ReviewCardProps {
  review: Review
  showUserInfo: boolean
  isBusinessOwner?: boolean
  businessName?: string
  onUpdate: () => void
}

export default function ReviewCard({ 
  review, 
  showUserInfo, 
  isBusinessOwner = false,
  businessName,
  onUpdate 
}: ReviewCardProps) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false) // State to toggle reply form

  
  const isOwner = user?.id === review.user_id
  const canEdit = isOwner && review.edit_count < 2
  const canDelete = isOwner

  const handleReplyClick = () => {
    setShowReplyForm((prev) => !prev) // Toggle the reply form visibility
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!user || !canDelete) return

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      
      const { success, error } = await reviewService.deleteReview(review.id, user.id)
      
      if (!success) {
        alert(error || 'Failed to delete review')
        return
      }

      // Notify parent to refresh reviews
      onUpdate()
      
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setDeleting(false)
    }
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
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500">
                {formatDate(review.created_at)}
              </span>
              {review.is_verified && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Verified
                </Badge>
              )}
              {review.edit_count > 0 && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Edited
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu for Review Owner */}
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto"
                onClick={() => {
                  // This will be handled by parent component
                  const editEvent = new CustomEvent('editReview', { 
                    detail: review 
                  })
                  window.dispatchEvent(editEvent)
                }}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
                {review.edit_count > 0 && (
                  <span className="ml-1">({2 - review.edit_count} left)</span>
                )}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        )}
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

      {/* Edit History */}
      {review.edit_count > 0 && review.edited_at && (
        <div className="text-xs text-gray-500 mb-3 italic">
          Last edited on {formatDate(review.edited_at)}
        </div>
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

      {/* Reply Button for Business Owners */}
      {isBusinessOwner && !review.reply && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={handleReplyClick} // Open reply form
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply to Review
          </Button>
        </div>
      )}

      {/* Review Reply Form */}
      {showReplyForm && (
        <div className="mt-4">
          <ReviewReplyForm 
            review={review} 
            businessName={businessName ?? 'Unnamed Business'} 
            onSuccess={() => {
              setShowReplyForm(false) // Close form after successful reply
              onUpdate() // Notify parent to refresh reviews
            }}
            onCancel={() => setShowReplyForm(false)} // Close form on cancel
          />
        </div>
      )}
    </div>
  )
}