// src/components/reviews/edit-review-form.tsx

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { reviewService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StarRating from './star-rating'
import type { Review, ReviewFormData } from '@/types/reviews'

interface EditReviewFormProps {
  review: Review
  businessName: string
  onSuccess: () => void
  onCancel: () => void
}

export default function EditReviewForm({ 
  review, 
  businessName, 
  onSuccess, 
  onCancel 
}: EditReviewFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: review.rating,
    title: review.title || '',
    content: review.content || ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please sign in to edit review')
      return
    }

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

      const { success, error: submitError } = await reviewService.updateReview(
        review.id, 
        user.id, 
        formData
      )

      if (!success) {
        throw new Error(submitError || 'Failed to update review')
      }

      // Notify parent component
      onSuccess()
      
    } catch (err) {
      console.error('Error updating review:', err)
      setError(err instanceof Error ? err.message : 'Failed to update review')
    } finally {
      setSubmitting(false)
    }
  }

  const editsRemaining = 2 - review.edit_count

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Your Review for {businessName}</span>
          <Badge className="bg-blue-100 text-blue-800">
            {editsRemaining} edit{editsRemaining !== 1 ? 's' : ''} remaining
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <StarRating
              rating={formData.rating}
              size="lg"
              interactive={true}
              onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            />
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
              {submitting ? 'Updating...' : 'Update Review'}
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