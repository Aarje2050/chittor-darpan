// src/components/reviews/review-reply-form.tsx

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { reviewService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Review } from '@/types/reviews'

interface ReviewReplyFormProps {
  review: Review
  businessName: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ReviewReplyForm({ 
  review, 
  businessName, 
  onSuccess, 
  onCancel 
}: ReviewReplyFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please sign in to reply')
      return
    }

    if (!content.trim()) {
      setError('Please write a reply')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const { success, error: submitError } = await reviewService.addReviewReply(
        review.id,
        review.business_id,
        user.id,
        content.trim()
      )

      if (!success) {
        throw new Error(submitError || 'Failed to submit reply')
      }

      // Reset form and notify parent
      setContent('')
      onSuccess()
      
    } catch (err) {
      console.error('Error submitting reply:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-base text-blue-800">
          Reply to {review.user_name || 'Customer'}'s Review
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Info */}
          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Replying as {businessName}</span>
          </div>

          {/* Reply Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Response *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Thank the customer and address their feedback professionally..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length}/500 characters
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Reply Guidelines:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Thank the customer for their feedback</li>
              <li>• Address their concerns professionally</li>
              <li>• Keep it concise and helpful</li>
              <li>• Avoid defensive or argumentative language</li>
            </ul>
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
              disabled={submitting || !content.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Posting Reply...' : 'Post Reply'}
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