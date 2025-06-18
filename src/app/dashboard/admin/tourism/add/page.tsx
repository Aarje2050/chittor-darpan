// src/app/dashboard/admin/tourism/add/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { tourismService, locationService, categoryService } from '@/lib/database'
import { type City, type Area, type Category } from '@/lib/database'
import { type TourismFormData } from '@/types/database'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminAddTourismPage() {
  const [formData, setFormData] = useState<TourismFormData>({
    name: '',
    description: '',
    short_description: '',
    address: '',
    city_id: '',
    area_id: '',
    category_id: '',
    entry_fee: '',
    timings: '',
    best_time_to_visit: '',
    duration: '',
    latitude: undefined,
    longitude: undefined
  })
  
  const [cities, setCities] = useState<City[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    if (formData.city_id) {
      loadAreas(formData.city_id)
    } else {
      setAreas([])
      setFormData(prev => ({ ...prev, area_id: '' }))
    }
  }, [formData.city_id])

  const loadFormData = async () => {
    try {
      const [citiesResult, categoriesResult] = await Promise.all([
        locationService.getCities(),
        tourismService.getTourismCategories()
      ])

      if (citiesResult.data) setCities(citiesResult.data)
      if (categoriesResult.data) setCategories(categoriesResult.data)

    } catch (err) {
      console.error('Error loading form data:', err)
      setError('Failed to load form data')
    }
  }

  const loadAreas = async (cityId: string) => {
    try {
      const { data } = await locationService.getAreasByCity(cityId)
      setAreas(data || [])
    } catch (err) {
      console.error('Error loading areas:', err)
    }
  }

  const handleInputChange = (field: keyof TourismFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Tourism place name is required'
    if (!formData.description.trim()) return 'Description is required'
    if (!formData.short_description.trim()) return 'Short description is required'
    if (!formData.city_id) return 'City is required'
    if (!formData.category_id) return 'Category is required'
    if (!formData.address.trim()) return 'Address is required'

    if (formData.name.length < 3) return 'Tourism place name must be at least 3 characters'
    if (formData.description.length < 50) return 'Description must be at least 50 characters'
    if (formData.short_description.length < 20) return 'Short description must be at least 20 characters'

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to add tourism places')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const tourismData = {
        ...formData,
        is_featured: isFeatured,
        status: status
      }

      const { data, error: createError } = await tourismService.createTourismPlace(tourismData, user.id)

      if (createError) {
        setError('Failed to create tourism place. Please try again.')
        return
      }

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/admin/tourism')
      }, 2000)

    } catch (err) {
      console.error('Error creating tourism place:', err)
      setError('Failed to create tourism place. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tourism Place Added!</h2>
            <p className="text-gray-600 mb-4">
              The tourism place has been created successfully with status: {status}
            </p>
            <p className="text-sm text-gray-500">Redirecting to tourism management...</p>
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
          title="Add Tourism Place"
          showBackButton
          onBackClick={() => router.push('/dashboard/admin/tourism')}
        />
        
        <div className="px-4 py-6">
          <MobileAddTourismForm
            formData={formData}
            cities={cities}
            areas={areas}
            categories={categories}
            isFeatured={isFeatured}
            status={status}
            loading={loading}
            error={error}
            onInputChange={handleInputChange}
            onFeaturedChange={setIsFeatured}
            onStatusChange={setStatus}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/admin/tourism')}
              className="flex items-center gap-2 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tourism Management
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">Add New Tourism Place</h1>
            <p className="text-gray-600 mt-2">Create a new tourism destination for visitors to discover</p>
          </div>

          <DesktopAddTourismForm
            formData={formData}
            cities={cities}
            areas={areas}
            categories={categories}
            isFeatured={isFeatured}
            status={status}
            loading={loading}
            error={error}
            onInputChange={handleInputChange}
            onFeaturedChange={setIsFeatured}
            onStatusChange={setStatus}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  )
}

// Mobile Form Component
interface TourismFormProps {
  formData: TourismFormData
  cities: City[]
  areas: Area[]
  categories: Category[]
  isFeatured: boolean
  status: 'draft' | 'published'
  loading: boolean
  error: string | null
  onInputChange: (field: keyof TourismFormData, value: string | number | undefined) => void
  onFeaturedChange: (featured: boolean) => void
  onStatusChange: (status: 'draft' | 'published') => void
  onSubmit: (e: React.FormEvent) => void
}

function MobileAddTourismForm({
  formData,
  cities,
  areas,
  categories,
  isFeatured,
  status,
  loading,
  error,
  onInputChange,
  onFeaturedChange,
  onStatusChange,
  onSubmit
}: TourismFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Error Message */}
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

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tourism Place Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="e.g., Chittorgarh Fort"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description *
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) => onInputChange('short_description', e.target.value)}
              placeholder="Brief description that appears in listings (20+ characters)"
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.short_description.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Detailed description with history, significance, and visitor information (50+ characters)"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length} characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <select
              value={formData.city_id}
              onChange={(e) => onInputChange('city_id', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area (Optional)
            </label>
            <select
              value={formData.area_id || ''}
              onChange={(e) => onInputChange('area_id', e.target.value || undefined)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={!formData.city_id}
            >
              <option value="">Select Area</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => onInputChange('category_id', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              placeholder="Complete address with landmarks"
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Tourism Details */}
      <Card>
        <CardHeader>
          <CardTitle>Tourism Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Fee
            </label>
            <input
              type="text"
              value={formData.entry_fee || ''}
              onChange={(e) => onInputChange('entry_fee', e.target.value)}
              placeholder="e.g., ₹50 for Indians, ₹300 for foreigners, Free"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timings
            </label>
            <input
              type="text"
              value={formData.timings || ''}
              onChange={(e) => onInputChange('timings', e.target.value)}
              placeholder="e.g., 9:30 AM - 6:30 PM, 24 hours"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Best Time to Visit
            </label>
            <input
              type="text"
              value={formData.best_time_to_visit || ''}
              onChange={(e) => onInputChange('best_time_to_visit', e.target.value)}
              placeholder="e.g., October to March, Early morning"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={formData.duration || ''}
              onChange={(e) => onInputChange('duration', e.target.value)}
              placeholder="e.g., 2-3 hours, Half day, Full day"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coordinates (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>GPS Coordinates (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => onInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="24.8879"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => onInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="74.6293"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onStatusChange('draft')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  status === 'draft'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Draft</div>
                <div className="text-xs text-gray-500">Save for later</div>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('published')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  status === 'published'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="font-medium">Published</div>
                <div className="text-xs text-gray-500">Live on site</div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Featured Place</span>
            </label>
            <Badge variant="secondary" className="text-xs">
              Shows first in listings
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="p-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Tourism Place...
              </div>
            ) : (
              `Create Tourism Place as ${status === 'draft' ? 'Draft' : 'Published'}`
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

// Desktop Form Component (same props as mobile)
function DesktopAddTourismForm(props: TourismFormProps) {
  const {
    formData,
    cities,
    areas,
    categories,
    isFeatured,
    status,
    loading,
    error,
    onInputChange,
    onFeaturedChange,
    onStatusChange,
    onSubmit
  } = props

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
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

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tourism Place Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                placeholder="e.g., Chittorgarh Fort"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => onInputChange('short_description', e.target.value)}
                placeholder="Brief description that appears in listings (20+ characters)"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.short_description.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder="Detailed description with history, significance, and visitor information (50+ characters)"
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length} characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <select
                  value={formData.city_id}
                  onChange={(e) => onInputChange('city_id', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (Optional)
                </label>
                <select
                  value={formData.area_id || ''}
                  onChange={(e) => onInputChange('area_id', e.target.value || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  disabled={!formData.city_id}
                >
                  <option value="">Select Area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => onInputChange('category_id', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => onInputChange('address', e.target.value)}
                placeholder="Complete address with landmarks"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base"
                required
              />
            </div>

            {/* GPS Coordinates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                GPS Coordinates (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => onInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Latitude (24.8879)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => onInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Longitude (74.6293)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tourism Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tourism Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Fee
                </label>
                <input
                  type="text"
                  value={formData.entry_fee || ''}
                  onChange={(e) => onInputChange('entry_fee', e.target.value)}
                  placeholder="₹50 for Indians, ₹300 for foreigners"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timings
                </label>
                <input
                  type="text"
                  value={formData.timings || ''}
                  onChange={(e) => onInputChange('timings', e.target.value)}
                  placeholder="9:30 AM - 6:30 PM"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Best Time to Visit
                </label>
                <input
                  type="text"
                  value={formData.best_time_to_visit || ''}
                  onChange={(e) => onInputChange('best_time_to_visit', e.target.value)}
                  placeholder="October to March"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => onInputChange('duration', e.target.value)}
                  placeholder="2-3 hours"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Publishing Options */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onStatusChange('draft')}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    status === 'draft'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">Draft</div>
                  <div className="text-xs text-gray-500">Save for later editing</div>
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange('published')}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    status === 'published'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <div className="font-medium">Published</div>
                  <div className="text-xs text-gray-500">Live on website</div>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => onFeaturedChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Featured Place</span>
                  <p className="text-xs text-gray-500">Shows first in listings and search results</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="p-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                `Create as ${status === 'draft' ? 'Draft' : 'Published'}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}