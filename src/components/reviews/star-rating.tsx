// src/components/reviews/star-rating.tsx

interface StarRatingProps {
    rating: number
    size?: 'sm' | 'md' | 'lg'
    showNumber?: boolean
    interactive?: boolean
    onRatingChange?: (rating: number) => void
  }
  
  export default function StarRating({ 
    rating, 
    size = 'md', 
    showNumber = false,
    interactive = false,
    onRatingChange
  }: StarRatingProps) {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }
  
    const handleStarClick = (starRating: number) => {
      if (interactive && onRatingChange) {
        onRatingChange(starRating)
      }
    }
  
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer touch-manipulation' : 'cursor-default'}`}
          >
            <svg
              className={`${sizeClasses[size]} transition-colors ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              } ${interactive ? 'hover:text-yellow-300' : ''}`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        {showNumber && (
          <span className="text-sm text-gray-600 ml-1">
            ({rating.toFixed(1)})
          </span>
        )}
      </div>
    )
  }