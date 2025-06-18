// src/app/dashboard/admin/tourism/[id]/images/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { tourismService, tourismImageService } from '@/lib/database'
import { type TourismPlace} from '@/lib/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TourismImage {
  id: string
  image_url: string
  image_path: string
  alt_text: string | null
  caption: string | null
  image_type: 'cover' | 'gallery' | 'featured'
  is_featured: boolean
  sort_order: number
  created_at: string
  uploader_name?: string
}

export default function AdminTourismImagesPage() {
  const [tourismPlace, setTourismPlace] = useState<TourismPlace | null>(null)
  const [images, setImages] = useState<TourismImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const placeId = params.id as string

  useEffect(() => {
    if (placeId) {
      loadTourismPlaceData()
    }
  }, [placeId])

  const loadTourismPlaceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load tourism place and its images
      const [placeResult, imagesResult] = await Promise.all([
        tourismService.getTourismPlaces({ limit: 1000 }), // Get all places to find by ID
        tourismImageService.getTourismPlaceImages(placeId)
      ])

      // Find the place by ID or slug
      if (placeResult.data) {
        const place = placeResult.data.find(p => p.id === placeId || p.slug === placeId)
        if (place) {
          setTourismPlace(place)
        } else {
          setError('Tourism place not found')
          return
        }
      } else {
        setError('Failed to load tourism place')
        return
      }

      if (imagesResult.data) {
        setImages(imagesResult.data)
      }

    } catch (err) {
      console.error('Error loading tourism place data:', err)
      setError('Failed to load tourism place data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user || !tourismPlace) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`)
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`${file.name} is too large (max 10MB)`)
        }

        // Upload image
        return tourismImageService.uploadTourismImage(file, tourismPlace.id, user.id, {
          imageType: 'gallery',
          altText: `${tourismPlace.name} image`,
          isFeatured: false
        })
      })

      const results = await Promise.all(uploadPromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        setError(`Failed to upload ${errors.length} image(s)`)
      } else {
        setSuccess(`Successfully uploaded ${results.length} image(s)`)
      }

      // Reload images
      await loadImages()

    } catch (err) {
      console.error('Error uploading images:', err)
      setError('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const loadImages = async () => {
    if (!tourismPlace) return

    try {
      const { data } = await tourismImageService.getTourismPlaceImages(tourismPlace.id)
      setImages(data || [])
    } catch (err) {
      console.error('Error loading images:', err)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      const { success, error } = await tourismImageService.deleteTourismImage(imageId)

      if (success) {
        setSuccess('Image deleted successfully')
        await loadImages()
      } else {
        setError(error || 'Failed to delete image')
      }
    } catch (err) {
      console.error('Error deleting image:', err)
      setError('Failed to delete image')
    }
  }

  const handleToggleFeatured = async (imageId: string, currentFeatured: boolean) => {
    try {
      setError(null)
      const { success, error } = await tourismImageService.updateTourismImage(imageId, {
        isFeatured: !currentFeatured
      })

      if (success) {
        setSuccess(`Image ${!currentFeatured ? 'marked as featured' : 'removed from featured'}`)
        await loadImages()
      } else {
        setError(error || 'Failed to update image')
      }
    } catch (err) {
      console.error('Error updating image:', err)
      setError('Failed to update image')
    }
  }

  const handleImageTypeChange = async (imageId: string, newType: 'cover' | 'gallery' | 'featured') => {
    try {
      setError(null)
      const { success, error } = await tourismImageService.updateTourismImage(imageId, {
        imageType: newType
      })

      if (success) {
        setSuccess(`Image type updated to ${newType}`)
        await loadImages()
      } else {
        setError(error || 'Failed to update image type')
      }
    } catch (err) {
      console.error('Error updating image type:', err)
      setError('Failed to update image type')
    }
  }

  if (loading) {
    return <TourismImagesPageSkeleton />
  }

  if (!tourismPlace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tourism Place Not Found</h2>
            <p className="text-gray-600 mb-4">The tourism place you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/admin/tourism')}>
              Back to Tourism Management
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="block lg:hidden min-h-screen bg-gray-50">
        <MobileHeader 
          title={`${tourismPlace.name} - Images`}
          showBackButton
          onBackClick={() => router.push('/dashboard/admin/tourism')}
        />
        
        <div className="px-4 py-6 space-y-6">
          <MobileTourismImageManagement
            tourismPlace={tourismPlace}
            images={images}
            uploading={uploading}
            error={error}
            success={success}
            onFileUpload={handleFileUpload}
            onDeleteImage={handleDeleteImage}
            onToggleFeatured={handleToggleFeatured}
            onImageTypeChange={handleImageTypeChange}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <DesktopTourismImageManagement
            tourismPlace={tourismPlace}
            images={images}
            uploading={uploading}
            error={error}
            success={success}
            onFileUpload={handleFileUpload}
            onDeleteImage={handleDeleteImage}
            onToggleFeatured={handleToggleFeatured}
            onImageTypeChange={handleImageTypeChange}
            onGoBack={() => router.push('/dashboard/admin/tourism')}
          />
        </div>
      </div>
    </>
  )
}

// Mobile Component
interface TourismImageManagementProps {
  tourismPlace: TourismPlace
  images: TourismImage[]
  uploading: boolean
  error: string | null
  success: string | null
  onFileUpload: (files: FileList | null) => void
  onDeleteImage: (id: string) => void
  onToggleFeatured: (id: string, currentFeatured: boolean) => void
  onImageTypeChange: (id: string, type: 'cover' | 'gallery' | 'featured') => void
}

function MobileTourismImageManagement({
  tourismPlace,
  images,
  uploading,
  error,
  success,
  onFileUpload,
  onDeleteImage,
  onToggleFeatured,
  onImageTypeChange
}: TourismImageManagementProps) {
  return (
    <>
      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tourism Place Info */}
      <Card>
        <CardHeader>
          <CardTitle>Image Gallery Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏛️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tourismPlace.name}</h3>
              <p className="text-sm text-gray-600">{images.length} images uploaded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="mb-4">
                <label className="block cursor-pointer">
                  <span className="sr-only">Choose images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => onFileUpload(e.target.files)}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Upload multiple images (JPEG, PNG, WebP)
                <br />
                Max 10MB per image
              </p>
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {images.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Images ({images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {images.map(image => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDelete={onDeleteImage}
                  onToggleFeatured={onToggleFeatured}
                  onTypeChange={onImageTypeChange}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images uploaded yet</h3>
            <p className="text-gray-600">Upload your first images to get started</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// Desktop Component
interface DesktopTourismImageManagementProps extends TourismImageManagementProps {
  onGoBack: () => void
}

function DesktopTourismImageManagement({
  tourismPlace,
  images,
  uploading,
  error,
  success,
  onFileUpload,
  onDeleteImage,
  onToggleFeatured,
  onImageTypeChange,
  onGoBack
}: DesktopTourismImageManagementProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex items-center gap-2 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tourism Management
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tourismPlace.name}</h1>
            <p className="text-gray-600 mt-1">Image Gallery Management • {images.length} images</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mb-4">
                    <label className="block cursor-pointer">
                      <span className="sr-only">Choose images</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => onFileUpload(e.target.files)}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Upload multiple images</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported: JPEG, PNG, WebP
                    <br />
                    Maximum: 10MB per image
                  </p>
                  {uploading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading images...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images Grid */}
        <div className="lg:col-span-2">
          {images.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Images ({images.length})</h2>
              <div className="space-y-4">
                {images.map(image => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onDelete={onDeleteImage}
                    onToggleFeatured={onToggleFeatured}
                    onTypeChange={onImageTypeChange}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No images uploaded yet</h3>
                <p className="text-gray-600">Upload your first images to create a gallery for this tourism place</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Image Card Component
function ImageCard({
  image,
  onDelete,
  onToggleFeatured,
  onTypeChange
}: {
  image: TourismImage
  onDelete: (id: string) => void
  onToggleFeatured: (id: string, currentFeatured: boolean) => void
  onTypeChange: (id: string, type: 'cover' | 'gallery' | 'featured') => void
}) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'cover':
        return <Badge className="bg-blue-100 text-blue-800">Cover</Badge>
      case 'featured':
        return <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
      case 'gallery':
      default:
        return <Badge variant="outline">Gallery</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image Thumbnail */}
          <div className="w-24 h-24 lg:w-32 lg:h-32 flex-shrink-0">
            <img
              src={image.image_url}
              alt={image.alt_text || 'Tourism image'}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          
          {/* Image Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex flex-wrap gap-1">
                {getTypeBadge(image.image_type)}
                {image.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>
                )}
              </div>
            </div>
            
            {image.caption && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{image.caption}</p>
            )}
            
            <div className="text-xs text-gray-500 mb-3">
              Uploaded: {new Date(image.created_at).toLocaleDateString()}
              {image.uploader_name && ` by ${image.uploader_name}`}
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Image Type Selector */}
              <select
                value={image.image_type}
                onChange={(e) => onTypeChange(image.id, e.target.value as any)}
                className="text-xs p-1 border border-gray-300 rounded"
              >
                <option value="gallery">Gallery</option>
                <option value="cover">Cover</option>
                <option value="featured">Featured</option>
              </select>
              
              {/* Toggle Featured */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleFeatured(image.id, image.is_featured)}
                className="text-xs"
              >
                {image.is_featured ? 'Remove Star' : 'Add Star'}
              </Button>
              
              {/* Delete */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(image.id)}
                className="text-xs border-red-300 text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function TourismImagesPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="block lg:hidden">
        <div className="h-14 bg-white animate-pulse"></div>
        <div className="px-4 py-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}