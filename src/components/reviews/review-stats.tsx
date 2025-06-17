// src/components/reviews/review-stats.tsx

import { Card, CardContent } from '@/components/ui/card'
import StarRating from './star-rating'
import type { ReviewStats } from '@/types/reviews'

interface ReviewStatsProps {
  stats: ReviewStats
}

export default function ReviewStatsCard({ stats }: ReviewStatsProps) {
  if (stats.totalReviews === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-2">--</div>
          <div className="flex justify-center mb-2">
            <StarRating rating={0} size="lg" />
          </div>
          <p className="text-gray-500 text-sm">No reviews yet</p>
        </CardContent>
      </Card>
    )
  }

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