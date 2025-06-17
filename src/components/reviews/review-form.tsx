// src/components/reviews/review-form.tsx

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { reviewService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StarRating from './star-rating'
import type { ReviewFormData } from '@/types/reviews'

interface ReviewFormProps {
  businessId: string
  businessName: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ReviewForm({ 
  businessId, 
  businessName, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please sign in to submit a review')
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

      const { success, error: submitError } = await reviewService.submitReview(
        businessId, 
        user.id, 
        formData
      )

      if (!success) {
        throw new Error(submitError || 'Failed to submit review')
      }

      // Reset form
      setFormData({ rating: 0, title: '', content: '' })
      
      // Notify parent component to refresh reviews
      onSuccess()
      
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