// src/components/business/business-gallery.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Camera, Eye, ChevronLeft, ChevronRight, Expand } from 'lucide-react'

interface BusinessGalleryProps {
  images: string[]
  businessName: string
  onViewAll: () => void
}

export default function BusinessGallery({ 
  images, 
  businessName, 
  onViewAll 
}: BusinessGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 h-64 md:h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative bg-black">
      {/* Main Gallery Display */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        {/* Current Image */}
        <div className="relative w-full h-full">
          <img 
            src={images[currentImageIndex]} 
            alt={`${businessName} - Photo ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
          
          {/* Image Overlay for Better Controls Visibility */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
          {/* Image Counter */}
          <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
          
          {/* View All Button */}
          <button 
            onClick={onViewAll}
            className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Expand className="w-4 h-4" />
            <span className="hidden sm:inline">View all</span>
          </button>
        </div>

        {/* Image Indicators (Dots) */}
        {images.length > 1 && images.length <= 8 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentImageIndex === index 
                    ? 'bg-white w-8' 
                    : 'bg-white/60 hover:bg-white/80'
                )}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom Thumbnail Strip (Desktop Only) */}
        {images.length > 1 && (
          <div className="hidden lg:flex absolute bottom-0 left-0 right-0 p-4 space-x-2 overflow-x-auto bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex space-x-2 min-w-max">
              {images.slice(0, 10).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    currentImageIndex === index 
                      ? 'border-white scale-110' 
                      : 'border-white/30 hover:border-white/60'
                  )}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
              
              {/* More Images Indicator */}
              {images.length > 10 && (
                <button
                  onClick={onViewAll}
                  className="flex-shrink-0 w-16 h-16 rounded-lg bg-black/60 backdrop-blur-sm border-2 border-white/30 hover:border-white/60 flex items-center justify-center text-white text-xs font-medium transition-all"
                >
                  +{images.length - 10}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Thumbnail Grid Below Main Image */}
      <div className="lg:hidden bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Photos ({images.length})
          </h3>
          <button 
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
          >
            <Eye className="w-4 h-4" />
            View all
          </button>
        </div>
        
        {/* Mobile Thumbnail Grid */}
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                currentImageIndex === index 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <img 
                src={image} 
                alt={`${businessName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        
        {/* View More Button for Mobile */}
        {images.length > 8 && (
          <button
            onClick={onViewAll}
            className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            View {images.length - 8} more photos
          </button>
        )}
      </div>
    </div>
  )
}