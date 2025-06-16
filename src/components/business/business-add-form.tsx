// src/components/business/business-add-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  businessService, 
  locationService, 
  categoryService,
  type BusinessFormData,
  type City,
  type Area,
  type Category
} from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FormErrors {
  name?: string
  description?: string
  address?: string
  city_id?: string
  phone?: string
  email?: string
  website?: string
  category_ids?: string
}

export default function BusinessAddForm() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Form data state
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    address: '',
    city_id: '',
    area_id: '',
    phone: [''],
    email: '',
    website: '',
    whatsapp: '',
    established_year: undefined,
    employee_count: undefined,
    category_ids: []
  })

  // Form state
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Dropdown data
  const [cities, setCities] = useState<City[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load areas when city changes
  useEffect(() => {
    if (formData.city_id) {
      loadAreas(formData.city_id)
    } else {
      setAreas([])
      setFormData(prev => ({ ...prev, area_id: '' }))
    }
  }, [formData.city_id])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      const [citiesResult, categoriesResult] = await Promise.all([
        locationService.getCities(),
        categoryService.getBusinessCategories()
      ])

      if (citiesResult.data) setCities(citiesResult.data)
      if (categoriesResult.data) setCategories(categoriesResult.data)

    } catch (err) {
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAreas = async (cityId: string) => {
    try {
      setLoadingAreas(true)
      const { data } = await locationService.getAreasByCity(cityId)
      setAreas(data || [])
    } catch (err) {
      console.error('Error loading areas:', err)
    } finally {
      setLoadingAreas(false)
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city_id) {
      newErrors.city_id = 'City is required'
    }

    const validPhones = formData.phone.filter(p => p.trim())
    if (validPhones.length === 0) {
      newErrors.phone = 'At least one phone number is required'
    } else {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/
      const invalidPhone = validPhones.find(p => !phoneRegex.test(p.trim()))
      if (invalidPhone) {
        newErrors.phone = 'Please enter valid phone numbers'
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.website && !/^https?:\/\//.test(formData.website)) {
      newErrors.website = 'Website URL must start with http:// or https://'
    }

    if (formData.category_ids.length === 0) {
      newErrors.category_ids = 'Please select at least one category'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (field: keyof BusinessFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle phone number changes
  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phone]
    newPhones[index] = value
    handleInputChange('phone', newPhones)
  }

  const addPhoneField = () => {
    if (formData.phone.length < 3) { // Limit to 3 phone numbers
      handleInputChange('phone', [...formData.phone, ''])
    }
  }

  const removePhoneField = (index: number) => {
    if (formData.phone.length > 1) {
      const newPhones = formData.phone.filter((_, i) => i !== index)
      handleInputChange('phone', newPhones)
    }
  }

  // Handle category selection
  const toggleCategory = (categoryId: string) => {
    const isSelected = formData.category_ids.includes(categoryId)
    const newCategories = isSelected
      ? formData.category_ids.filter(id => id !== categoryId)
      : [...formData.category_ids, categoryId]
    
    handleInputChange('category_ids', newCategories)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      alert('You must be logged in to add a business')
      return
    }

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      setSubmitting(true)

      const { data, error } = await businessService.create(formData, user.id)

      if (error) {
        throw new Error(error.message || 'Failed to create business listing')
      }

      // Success! Redirect to listings with success message
      router.push('/dashboard/business/my-listings?success=created')

    } catch (err) {
      console.error('Error creating business:', err)
      alert('Failed to create business listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Business</h1>
        <p className="text-gray-600">Create a new business listing for the directory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your business name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your business, services, and what makes it special"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will help customers understand what you offer
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* City */}
            <div>
              <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                id="city_id"
                name="city_id"
                value={formData.city_id}
                onChange={(e) => handleInputChange('city_id', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.city_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.city_id && (
                <p className="mt-1 text-sm text-red-600">{errors.city_id}</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label htmlFor="area_id" className="block text-sm font-medium text-gray-700 mb-2">
                Area/Locality
              </label>
              <select
                id="area_id"
                name="area_id"
                value={formData.area_id}
                onChange={(e) => handleInputChange('area_id', e.target.value)}
                disabled={!formData.city_id || loadingAreas}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">
                  {loadingAreas ? 'Loading areas...' : 'Select an area (optional)'}
                </option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter complete address including landmarks"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Numbers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Numbers *
              </label>
              {formData.phone.map((phone, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`Phone ${index + 1}`}
                  />
                  {formData.phone.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePhoneField(index)}
                      className="px-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
              {formData.phone.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhoneField}
                  className="mt-2"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Phone Number
                </Button>
              )}
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="business@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://your-website.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="WhatsApp number for customer contact"
              />
              <p className="mt-1 text-sm text-gray-500">
                Customers can contact you directly via WhatsApp
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Categories *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`p-3 border rounded-lg text-sm text-left transition-colors ${
                      formData.category_ids.includes(category.id)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              {errors.category_ids && (
                <p className="mt-1 text-sm text-red-600">{errors.category_ids}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Select categories that best describe your business
              </p>
            </div>

            {/* Established Year */}
            <div>
              <label htmlFor="established_year" className="block text-sm font-medium text-gray-700 mb-2">
                Established Year
              </label>
              <input
                type="number"
                id="established_year"
                name="established_year"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.established_year || ''}
                onChange={(e) => handleInputChange('established_year', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Year your business was established"
              />
            </div>

            {/* Employee Count */}
            <div>
              <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Employees
              </label>
              <select
                id="employee_count"
                name="employee_count"
                value={formData.employee_count || ''}
                onChange={(e) => handleInputChange('employee_count', e.target.value || undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select employee count</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Ready to Submit?</h3>
              <p className="text-gray-600">
                Your business listing will be reviewed by our team before going live. 
                This usually takes 1-2 business days.
              </p>
              
              {/* Selected Categories Display */}
              {formData.category_ids.length > 0 && (
                <div>
                  <p className="text-sm text-gray-700 mb-2">Selected categories:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {formData.category_ids.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId)
                      return category ? (
                        <Badge key={categoryId} className="bg-gray-100 text-gray-800">
                          {category.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/business')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white hover:bg-gray-800 min-w-[120px]"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}