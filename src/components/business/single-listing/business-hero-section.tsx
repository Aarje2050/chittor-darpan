// src/components/business/single-listing/business-hero-section.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type Business } from '@/lib/database'
import { Camera, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

interface BusinessHeroSectionProps {
  business: Business
  images: string[]
  onOpenModal?: (index: number) => void
}

export default function BusinessHeroSection({ 
  business, 
  images, 
  onOpenModal 
}: BusinessHeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (images.length === 0) {
    return (
      <div className="bg-gray-100 h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Camera className="w-16 h-16 mx-auto mb-3" />
          <p className="text-lg font-medium">No photos available</p>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0)
  }

  const prevImage = () => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1)
  }

  return (
    <div className="relative h-64 bg-gray-100">
      <Image 
        src={images[currentIndex]} 
        alt={`${business.name}`}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Image counter */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* View all photos button */}
      <button 
        onClick={() => onOpenModal?.(currentIndex)}
        className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black/80 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View All Photos
      </button>
    </div>
  )
}