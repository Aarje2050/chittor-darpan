// src/components/tourism/tourism-gallery.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GalleryImage {
  id: string
  url: string
  alt_text: string | null
  caption: string | null
  type: 'admin' | 'user'
  uploader_name?: string
  created_at: string
  is_featured?: boolean
}

interface TourismGalleryProps {
  images: GalleryImage[]
  filter: 'all' | 'admin' | 'user' | 'featured'
  onFilterChange: (filter: 'all' | 'admin' | 'user' | 'featured') => void
  isMobile: boolean
}

export default function TourismGallery({ 
  images, 
  filter, 
  onFilterChange, 
  isMobile 
}: TourismGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const adminImagesCount = images.filter(img => img.type === 'admin').length
  const userImagesCount = images.filter(img => img.type === 'user').length
  const featuredImagesCount = images.filter(img => img.is_featured).length

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No photos available yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share a photo by leaving a review!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Photo Gallery ({images.length})</CardTitle>
          </div>
          
          {/* Filter Buttons */}
          <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('all')}
              className="text-xs"
            >
              All ({images.filter(() => true).length})
            </Button>
            
            {adminImagesCount > 0 && (
              <Button
                variant={filter === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('admin')}
                className="text-xs"
              >
                Official ({adminImagesCount})
              </Button>
            )}
            
            {userImagesCount > 0 && (
              <Button
                variant={filter === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('user')}
                className="text-xs"
              >
                Visitor Photos ({userImagesCount})
              </Button>
            )}
            
            {featuredImagesCount > 0 && (
              <Button
                variant={filter === 'featured' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('featured')}
                className="text-xs"
              >
                Featured ({featuredImagesCount})
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Mobile Grid */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image.url}
                    alt={image.alt_text || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Type Badge */}
                  <div className="absolute top-2 left-2">
                    {image.type === 'admin' ? (
                      <Badge className="bg-blue-500 text-white text-xs">Official</Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white text-xs">Visitor</Badge>
                    )}
                  </div>
                  
                  {/* Featured Badge */}
                  {image.is_featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500 text-white text-xs">⭐</Badge>
                    </div>
                  )}
                  
                  {/* Caption Overlay */}
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      <p className="text-xs truncate">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Desktop Grid */}
          {!isMobile && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image.url}
                    alt={image.alt_text || 'Gallery image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                  
                  {/* Image Type Badge */}
                  <div className="absolute top-2 left-2">
                    {image.type === 'admin' ? (
                      <Badge className="bg-blue-500 text-white text-xs">Official</Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white text-xs">Visitor</Badge>
                    )}
                  </div>
                  
                  {/* Featured Badge */}
                  {image.is_featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500 text-white text-xs">⭐</Badge>
                    </div>
                  )}
                  
                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-3">
                    {image.caption && (
                      <p className="text-white text-sm font-medium mb-1 truncate">{image.caption}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>By {image.uploader_name || 'Anonymous'}</span>
                      <span>{new Date(image.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
          onPrev={() => setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1)}
        />
      )}
    </>
  )
}

// Image Lightbox Component
function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev
}: {
  images: GalleryImage[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}) {
  const currentImage = images[currentIndex]

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onClose, onNext, onPrev])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image Container */}
      <div className="max-w-4xl max-h-full mx-4 flex flex-col">
        <div className="relative flex-1 flex items-center justify-center">
          <img
            src={currentImage.url}
            alt={currentImage.alt_text || 'Gallery image'}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Image Info */}
        <div className="bg-black bg-opacity-50 text-white p-4 mt-4 rounded">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {currentImage.caption && (
                <h3 className="font-medium text-lg mb-2">{currentImage.caption}</h3>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>
                  {currentImage.type === 'admin' ? 'Official Photo' : 'Visitor Photo'}
                </span>
                <span>By {currentImage.uploader_name || 'Anonymous'}</span>
                <span>{new Date(currentImage.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              {currentImage.type === 'admin' && (
                <Badge className="bg-blue-500 text-white">Official</Badge>
              )}
              {currentImage.type === 'user' && (
                <Badge className="bg-green-500 text-white">Visitor</Badge>
              )}
              {currentImage.is_featured && (
                <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
              )}
            </div>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="text-center text-sm text-gray-400 mt-3">
              {currentIndex + 1} of {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  )
}