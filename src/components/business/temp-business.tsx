// src/components/business/proper-business-form.tsx - FIXED IMPLEMENTATION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  businessService, 
  locationService, 
  categoryService,
  type City,
  type Area,
  type Category
} from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, X, Phone, Mail, Globe, Camera, Plus, Check, AlertCircle, 
  MapPin, Building2, Image as ImageIcon, User, Facebook, Instagram,
  Bold, Italic, List, ListOrdered, Save, ChevronLeft, ChevronRight, Search
} from 'lucide-react'


// Simple Rich Text Editor (Fixed Width)
function RichTextEditor({ value, onChange, placeholder, maxLength = 500, error }: any) {
  const [focused, setFocused] = useState(false)

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    let newText = ''
    switch (format) {
      case 'bold':
        newText = selectedText ? `${beforeText}**${selectedText}**${afterText}` : `${beforeText}****${afterText}`
        break
      case 'italic':
        newText = selectedText ? `${beforeText}*${selectedText}*${afterText}` : `${beforeText}**${afterText}`
        break
      case 'bullet':
        newText = `${beforeText}• ${selectedText || 'List item'}${afterText}`
        break
      case 'number':
        newText = `${beforeText}1. ${selectedText || 'List item'}${afterText}`
        break
    }
    onChange(newText)
  }

  return (
    <div className={`border-2 rounded-lg transition-colors ${
      error ? 'border-red-500' : focused ? 'border-blue-500' : 'border-gray-200'
    }`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => applyFormat('bold')} className="p-2 rounded hover:bg-gray-200">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => applyFormat('italic')} className="p-2 rounded hover:bg-gray-200">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => applyFormat('bullet')} className="p-2 rounded hover:bg-gray-200">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => applyFormat('number')} className="p-2 rounded hover:bg-gray-200">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">{value.length}/{maxLength}</span>
      </div>
      
      {/* Editor - FIXED: Better mobile width */}
      <textarea
        id="rich-editor"
        value={value}
        onChange={(e) => e.target.value.length <= maxLength && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full p-4 min-h-[120px] border-0 focus:outline-none resize-none"
        rows={5}
      />
    </div>
  )
}

// Category Selector with Search
function CategorySelector({ categories, selected, onChange, error }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const filteredCategories = categories.filter((cat: Category) => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  )
  
  const selectedCategories = categories.filter((cat: Category) => selected.includes(cat.id))

  const toggleCategory = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      onChange(selected.filter((id: string) => id !== categoryId))
    } else if (selected.length < 3) {
      onChange([...selected, categoryId])
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 border-2 rounded-lg text-left flex items-center justify-between transition-colors ${
          error ? 'border-red-500' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <span className="text-gray-700">
          {selected.length === 0 ? 'Select categories...' : `${selected.length} categories selected`}
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.map((category: Category) => {
              const isSelected = selected.includes(category.id)
              const isDisabled = !isSelected && selected.length >= 3
              
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => !isDisabled && toggleCategory(category.id)}
                  disabled={isDisabled}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-700' : isDisabled ? 'text-gray-400' : ''
                  }`}
                >
                  <span>{category.name}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
          
          {/* Selected Preview */}
          {selectedCategories.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((cat: Category) => (
                  <Badge key={cat.id} className="bg-blue-100 text-blue-800">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// FIXED: Working Image Library
function ImageLibrary({ userId, imageType, onSelect, onClose }: any) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadUserImages()
  }, [userId])

  // FIXED: Load existing images from storage
  const loadUserImages = async () => {
    try {
      setLoading(true)
      
      // Get user's existing images from storage
      const { data: files, error } = await supabase.storage
        .from('business-images')
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (files) {
        const imageList = files
          .filter(file => file.name.includes(imageType) || imageType === 'gallery')
          .map(file => {
            const { data: urlData } = supabase.storage
              .from('business-images')
              .getPublicUrl(`${userId}/${file.name}`)
            
            return {
              id: file.name,
              name: file.name,
              url: urlData.publicUrl,
              created_at: file.created_at
            }
          })
        
        setImages(imageList)
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Working image upload
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${imageType}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('business-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      // Add to list and auto-select
      const newImage = {
        id: fileName,
        name: fileName,
        url: urlData.publicUrl,
        created_at: new Date().toISOString()
      }
      
      setImages(prev => [newImage, ...prev])
      onSelect(newImage.url)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Choose {imageType} image</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {/* Upload Area */}
          <div className="mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                uploading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium text-blue-600">
                {uploading ? 'Uploading...' : 'Click to upload new image'}
              </p>
            </label>
          </div>

          {/* Existing Images */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Your existing images ({images.length})</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => onSelect(image.url)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No images uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Form Component
export default function FixedBusinessForm() {
  const { user } = useAuth()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [showImageLibrary, setShowImageLibrary] = useState<any>({ show: false, type: 'logo' })
  const [autoSaving, setAutoSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category_ids: [],
    description: '',
    logo_url: '',
    cover_image_url: '',
    gallery_images: [] as string[], // Ensure this is always an array of strings
    city_id: '',
    area_id: '',
    address: '',
    phone: [''],
    email: '',
    website: '',
    whatsapp: '',
    facebook_url: '',
    instagram_url: ''
  })

  const [cities, setCities] = useState<City[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)

  useEffect(() => {
    loadInitialData()
    loadDraft() // Load saved draft
  }, [])

  useEffect(() => {
    if (formData.city_id) {
      loadAreas(formData.city_id)
    } else {
      setAreas([])
      updateField('area_id', '')
    }
  }, [formData.city_id])

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft()
    }, 2000)
    return () => clearTimeout(timer)
  }, [formData])

  const loadInitialData = async () => {
    try {
      const [citiesRes, categoriesRes] = await Promise.all([
        locationService.getCities(),
        categoryService.getBusinessCategories()
      ])
      if (citiesRes.data) setCities(citiesRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadAreas = async (cityId: string) => {
    try {
      setLoadingAreas(true)
      const { data } = await locationService.getAreasByCity(cityId)
      setAreas(data || [])
    } finally {
      setLoadingAreas(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  // FIXED: Save draft functionality
  const saveDraft = async () => {
    try {
      setAutoSaving(true)
      localStorage.setItem('business_form_draft', JSON.stringify(formData))
      setTimeout(() => setAutoSaving(false), 1000)
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('business_form_draft')
      if (draft) {
        const parsedData = JSON.parse(draft)
        // Ensure gallery_images is always an array
        setFormData({
          ...parsedData,
          gallery_images: parsedData.gallery_images || [],
          category_ids: parsedData.category_ids || [],
          phone: parsedData.phone || ['']
        })
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  const clearDraft = () => {
    localStorage.removeItem('business_form_draft')
  }

  // Phone management
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...formData.phone]
    newPhones[index] = value
    updateField('phone', newPhones)
  }

  const addPhone = () => {
    if (formData.phone.length < 3) {
      updateField('phone', [...formData.phone, ''])
    }
  }

  const removePhone = (index: number) => {
    if (formData.phone.length > 1) {
      updateField('phone', formData.phone.filter((_, i) => i !== index))
    }
  }

  // Image management
  const handleImageSelect = (url: string) => {
    const type = showImageLibrary.type
    if (type === 'gallery') {
      const currentGallery = formData.gallery_images || []
      if (!currentGallery.includes(url) && currentGallery.length < 6) {
        updateField('gallery_images', [...currentGallery, url])
      }
    } else {
      updateField(`${type}_url`, url)
    }
    setShowImageLibrary({ show: false, type: 'logo' })
  }

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: any = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Business name required'
      if (formData.category_ids.length === 0) newErrors.category_ids = 'Select at least one category'
      if (!formData.description.trim()) newErrors.description = 'Description required'
      else if (formData.description.length < 20) newErrors.description = 'At least 20 characters'
    }

    if (step === 3) {
      if (!formData.city_id) newErrors.city_id = 'City required'
      if (!formData.address.trim()) newErrors.address = 'Address required'
    }

    if (step === 4) {
      const validPhones = formData.phone.filter(p => p.trim())
      if (validPhones.length === 0) newErrors.phone = 'Phone number required'
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email'
      }
      if (formData.facebook_url && !formData.facebook_url.includes('facebook.com')) {
        newErrors.facebook_url = 'Invalid Facebook URL'
      }
      if (formData.instagram_url && !formData.instagram_url.includes('instagram.com')) {
        newErrors.instagram_url = 'Invalid Instagram URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4) || !user) return

    try {
      setSubmitting(true)

      const submissionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        city_id: formData.city_id,
        area_id: formData.area_id || undefined,
        phone: formData.phone.filter(p => p.trim()),
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        category_ids: formData.category_ids,
        logo_url: formData.logo_url || undefined,
        cover_image_url: formData.cover_image_url || undefined,
        gallery_images: (formData.gallery_images || []).length > 0 ? formData.gallery_images : undefined
      }

      const { data, error } = await businessService.create(submissionData, user.id)

      if (error) throw new Error(error.message || 'Failed to create business')

      clearDraft()
      router.push('/dashboard/business/my-listings?success=created')

    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: 'Failed to create business. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { id: 1, title: 'Business Details', icon: Building2 },
    { id: 2, title: 'Photos', icon: Camera },
    { id: 3, title: 'Location', icon: MapPin },
    { id: 4, title: 'Contact', icon: User }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4 lg:px-8"> {/* FIXED: Better mobile width */}
      {/* FIXED: Top Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 -mx-2 sm:-mx-4 lg:-mx-8 px-2 sm:px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Save className={`w-4 h-4 ${autoSaving ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {autoSaving ? 'Saving...' : 'Draft saved'}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">Step {currentStep} of 4</p>
            <p className="text-xs text-gray-500">{steps[currentStep - 1].title}</p>
          </div>
          
          <button
            onClick={currentStep === 4 ? handleSubmit : nextStep}
            disabled={submitting}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : currentStep === 4 ? (
              <Check className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      {/* Form Content */}
      <Card className="border-0 shadow-sm sm:border sm:shadow-md"> {/* FIXED: Better mobile card */}
        <CardContent className="p-3 sm:p-6"> {/* FIXED: Better mobile padding */}
          {/* Step 1: Business Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-6">Business Information</h2>
                
                {/* Business Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your business name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* FIXED: Category Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories * (Select up to 3)
                  </label>
                  <CategorySelector
                    categories={categories}
                    selected={formData.category_ids}
                    onChange={(categoryIds: string[]) => updateField('category_ids', categoryIds)}
                    error={!!errors.category_ids}
                  />
                  {errors.category_ids && <p className="mt-1 text-sm text-red-600">{errors.category_ids}</p>}
                </div>

                {/* FIXED: Better Rich Text Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value: string) => updateField('description', value)}
                    placeholder="Describe your business, services, and what makes it special..."
                    error={!!errors.description}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Business Photos</h2>
              
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Logo</label>
                {formData.logo_url ? (
                  <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium">Logo selected</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => updateField('logo_url', '')}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImageLibrary({ show: true, type: 'logo' })}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Add Business Logo</p>
                  </button>
                )}
              </div>

              {/* Cover Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cover Photo</label>
                {formData.cover_image_url ? (
                  <div className="relative">
                    <img src={formData.cover_image_url} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('cover_image_url', '')}
                      className="absolute top-3 right-3 bg-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImageLibrary({ show: true, type: 'cover' })}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex items-center justify-center"
                  >
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Add Cover Photo</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gallery ({(formData.gallery_images || []).length}/6)
                </label>
                
                {(formData.gallery_images || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(formData.gallery_images || []).map((url: string, index: number) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => {
                            const newGallery = (formData.gallery_images || []).filter((_: any, i: number) => i !== index)
                            updateField('gallery_images', newGallery)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {(formData.gallery_images || []).length < 6 && (
                  <button
                    type="button"
                    onClick={() => setShowImageLibrary({ show: true, type: 'gallery' })}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Add Gallery Photos</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Location</h2>
              
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => updateField('city_id', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.city_id ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                  {errors.city_id && <p className="mt-1 text-sm text-red-600">{errors.city_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                  <select
                    value={formData.area_id}
                    onChange={(e) => updateField('area_id', e.target.value)}
                    disabled={!formData.city_id}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">{loadingAreas ? 'Loading...' : 'Select Area (Optional)'}</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Complete address with landmarks"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Contact & Social</h2>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Phone Numbers *</label>
                <div className="space-y-3">
                  {formData.phone.map((phone: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => updatePhone(index, e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-200'
                          }`}
                          placeholder={`Phone ${index + 1}`}
                        />
                      </div>
                      {formData.phone.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removePhone(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.phone.length < 3 && (
                    <Button variant="outline" size="sm" onClick={addPhone}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Phone
                    </Button>
                  )}
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>

              {/* Email & Website */}
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="business@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => updateField('whatsapp', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="WhatsApp number"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-medium mb-4">Social Media</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.facebook_url}
                        onChange={(e) => updateField('facebook_url', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.facebook_url ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    {errors.facebook_url && <p className="mt-1 text-sm text-red-600">{errors.facebook_url}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.instagram_url}
                        onChange={(e) => updateField('instagram_url', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.instagram_url ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="https://instagram.com/yourbusiness"
                      />
                    </div>
                    {errors.instagram_url && <p className="mt-1 text-sm text-red-600">{errors.instagram_url}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FIXED: Bottom Navigation */}
          <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="min-w-[100px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : currentStep === 4 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Business
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FIXED: Working Image Library */}
      {showImageLibrary.show && user && (
        <ImageLibrary
          userId={user.id}
          imageType={showImageLibrary.type}
          onSelect={handleImageSelect}
          onClose={() => setShowImageLibrary({ show: false, type: 'logo' })}
        />
      )}
    </div>
  )
}