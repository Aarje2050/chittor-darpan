// src/lib/services/tourism.ts - Fixed with proper error handling
import { supabase } from '../supabase'

export interface TourismPlace {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  city_id: string | null
  area_id: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  category_id: string | null
  entry_fee: string | null
  timings: string | null
  best_time_to_visit: string | null
  duration: string | null
  status: 'draft' | 'published' | 'rejected'
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Related data (populated by joins)
  city_name?: string
  area_name?: string | null
  category_name?: string | null
  creator_name?: string | null
  creator_email?: string | null
}

export interface TourismFormData {
  name: string
  description: string
  short_description: string
  address: string
  city_id: string
  area_id?: string
  category_id: string
  entry_fee?: string
  timings?: string
  best_time_to_visit?: string
  duration?: string
  latitude?: number
  longitude?: number
}

export interface TourismCounts {
  total: number
  pending: number // Maps to 'draft' status in database
  published: number
  rejected: number
}

export interface TourismImage {
  id: string
  tourism_place_id: string
  image_url: string
  image_path: string
  alt_text: string | null
  caption: string | null
  image_type: 'cover' | 'gallery' | 'featured'
  is_featured: boolean
  sort_order: number
  uploaded_by: string | null
  created_at: string
  updated_at: string
  uploader_name?: string
  place_name?: string
  place_slug?: string
}

export interface TourismReview {
  id: string
  tourism_place_id: string
  user_id: string
  rating: number
  title: string | null
  content: string | null
  visit_date: string | null
  status: 'pending' | 'published' | 'rejected'
  is_verified: boolean
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  place_name?: string
  place_slug?: string
  images?: TourismReviewImage[]
}

export interface TourismReviewImage {
  id: string
  review_id: string
  tourism_place_id: string
  image_url: string
  image_path: string
  alt_text: string | null
  caption: string | null
  sort_order: number
  created_at: string
}

export interface TourismReviewFormData {
  rating: number
  title?: string
  content?: string
  visitDate?: string
}

// Tourism Places Service
export const tourismService = {
  /**
   * Get tourism places with optional filters
   */
  async getTourismPlaces(filters: any = {}): Promise<{ data: TourismPlace[] | null; error: any }> {
    try {
      let query = supabase
        .from('tourism_places')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          categories:category_id(name),
          profiles:created_by(full_name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search?.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`)
      }

      if (filters.categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .eq('feature_type', 'tourism')
          .single()

        if (category) {
          query = query.eq('category_id', category.id)
        }
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.city) {
        query = query.eq('city_id', filters.city)
      }

      if (filters.area) {
        query = query.eq('area_id', filters.area)
      }

      if (filters.featured) {
        query = query.eq('is_featured', true)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tourism places:', error)
        return { data: null, error }
      }

      const tourismPlaces = (data || []).map(item => ({
        ...item,
        city_name: item.cities?.name || 'Unknown City',
        area_name: item.areas?.name || null,
        category_name: item.categories?.name || null,
        creator_name: item.profiles?.full_name || null,
        creator_email: item.profiles?.email || null
      }))

      return { data: tourismPlaces, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismPlaces:', error)
      return { data: null, error }
    }
  },

  /**
   * Get tourism place by slug
   */
  async getTourismPlaceBySlug(slug: string): Promise<{ data: TourismPlace | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tourism_places')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          categories:category_id(name),
          profiles:created_by(full_name, email)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) {
        console.error('Error fetching tourism place by slug:', error)
        return { data: null, error }
      }

      const tourismPlace = {
        ...data,
        city_name: data.cities?.name || 'Unknown City',
        area_name: data.areas?.name || null,
        category_name: data.categories?.name || null,
        creator_name: data.profiles?.full_name || null,
        creator_email: data.profiles?.email || null
      }

      return { data: tourismPlace, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismPlaceBySlug:', error)
      return { data: null, error }
    }
  },

  /**
   * Get tourism categories
   */
  async getTourismCategories(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .eq('feature_type', 'tourism')
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.error('Error fetching tourism categories:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismCategories:', error)
      return { data: null, error }
    }
  },

  /**
   * Get tourism place counts (for admin)
   */
  async getTourismCounts(): Promise<{ data: TourismCounts | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tourism_places')
        .select('status')

      if (error) {
        console.error('Error getting tourism counts:', error)
        return { data: null, error }
      }

      const counts = {
        total: data?.length || 0,
        pending: data?.filter(t => t.status === 'draft').length || 0,
        published: data?.filter(t => t.status === 'published').length || 0,
        rejected: data?.filter(t => t.status === 'rejected').length || 0
      }

      return { data: counts, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismCounts:', error)
      return { data: null, error }
    }
  },

  /**
   * Create new tourism place (admin only)
   */
  async createTourismPlace(formData: any, adminId: string): Promise<{ data: TourismPlace | null; error: any }> {
    try {
      const baseSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      let slug = baseSlug
      let counter = 1
      let slugExists = true

      while (slugExists) {
        const { data: existingPlace } = await supabase
          .from('tourism_places')
          .select('slug')
          .eq('slug', slug)
          .single()

        if (!existingPlace) {
          slugExists = false
        } else {
          slug = `${baseSlug}-${counter}`
          counter++
        }
      }

      const tourismData = {
        name: formData.name.trim(),
        slug: slug,
        description: formData.description?.trim() || null,
        short_description: formData.short_description?.trim() || null,
        city_id: formData.city_id,
        area_id: formData.area_id || null,
        category_id: formData.category_id,
        address: formData.address?.trim() || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        entry_fee: formData.entry_fee?.trim() || null,
        timings: formData.timings?.trim() || null,
        best_time_to_visit: formData.best_time_to_visit?.trim() || null,
        duration: formData.duration?.trim() || null,
        status: formData.status || 'draft',
        is_featured: formData.is_featured || false,
        created_by: adminId
      }

      const { data, error } = await supabase
        .from('tourism_places')
        .insert([tourismData])
        .select()
        .single()

      if (error) {
        console.error('Error creating tourism place:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in createTourismPlace:', error)
      return { data: null, error }
    }
  },

  /**
   * Update tourism place status (admin function)
   */
  async updateTourismStatus(id: string, status: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('tourism_places')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating tourism status:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateTourismStatus:', error)
      return { success: false, error }
    }
  },

  /**
   * Delete tourism place (admin function)
   */
  async deleteTourismPlace(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('tourism_places')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting tourism place:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in deleteTourismPlace:', error)
      return { success: false, error }
    }
  }
}

// Tourism Images Service
export const tourismImageService = {
  /**
   * Get images for a tourism place
   */
  async getTourismPlaceImages(placeId: string, imageType?: 'cover' | 'gallery' | 'featured'): Promise<{ data: TourismImage[] | null; error: any }> {
    try {
      let query = supabase
        .from('media_files')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .eq('entity_type', 'tourism')
        .eq('entity_id', placeId)
        .eq('is_active', true)
        .order('sort_order')

      if (imageType) {
        query = query.eq('image_type', imageType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tourism images:', error)
        return { data: null, error }
      }

      // Map media_files structure to TourismImage interface
      const images = (data || []).map(item => ({
        id: item.id,
        tourism_place_id: item.entity_id,
        image_url: item.url,
        image_path: item.image_path || '',
        alt_text: item.alt_text,
        caption: item.caption,
        image_type: item.image_type || 'gallery',
        is_featured: item.is_featured || false,
        sort_order: item.sort_order || 0,
        uploaded_by: item.uploaded_by,
        created_at: item.created_at,
        updated_at: item.created_at, // media_files might not have updated_at
        uploader_name: item.profiles?.full_name
      }))

      return { data: images, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismPlaceImages:', error)
      return { data: null, error }
    }
  },

  /**
   * Upload image for tourism place (admin only) - USING MEDIA_FILES
   */
  async uploadTourismImage(
    file: File, 
    placeId: string, 
    adminId: string, 
    options: {
      imageType?: 'cover' | 'gallery' | 'featured'
      altText?: string
      caption?: string
      isFeatured?: boolean
    } = {}
  ): Promise<{ data: TourismImage | null; error: any }> {
    try {
      // Validate inputs
      if (!file || !placeId || !adminId) {
        return { data: null, error: 'Missing required parameters' }
      }

      console.log('Starting image upload for place:', placeId, 'by admin:', adminId)

      const fileExt = file.name.split('.').pop()
      const fileName = `${adminId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `tourism/${placeId}/${fileName}`

      console.log('Uploading to storage path:', filePath)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tourism-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { data: null, error: `Failed to upload image: ${uploadError.message}` }
      }

      console.log('Storage upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tourism-images')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', urlData.publicUrl)

      // Prepare image data for media_files table
      const imageData = {
        url: urlData.publicUrl,
        image_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        alt_text: options.altText || null,
        caption: options.caption || null,
        image_type: options.imageType || 'gallery',
        is_featured: options.isFeatured || false,
        sort_order: 0,
        entity_type: 'tourism',
        entity_id: placeId,
        uploaded_by: adminId,
        is_active: true
      }

      console.log('Inserting image data:', imageData)

      // Insert into media_files table
      const { data, error } = await supabase
        .from('media_files')
        .insert([imageData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('tourism-images')
          .remove([filePath])
        
        return { data: null, error: `Failed to save image record: ${error.message}` }
      }

      console.log('Database insert successful:', data)

      // Map response back to TourismImage interface
      const tourismImage = {
        id: data.id,
        tourism_place_id: data.entity_id,
        image_url: data.url,
        image_path: data.image_path,
        alt_text: data.alt_text,
        caption: data.caption,
        image_type: data.image_type,
        is_featured: data.is_featured,
        sort_order: data.sort_order,
        uploaded_by: data.uploaded_by,
        created_at: data.created_at,
        updated_at: data.created_at
      }

      return { data: tourismImage, error: null }

    } catch (error) {
      console.error('Unexpected error in uploadTourismImage:', error)
      return { data: null, error: `Failed to upload image: ${error}` }
    }
  },

  /**
   * Delete tourism image (admin only) - USING MEDIA_FILES
   */
  async deleteTourismImage(imageId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('Deleting tourism image:', imageId)

      // Get image record first
      const { data: imageRecord, error: fetchError } = await supabase
        .from('media_files')
        .select('image_path')
        .eq('id', imageId)
        .eq('entity_type', 'tourism')
        .single()

      if (fetchError) {
        console.error('Error fetching image record:', fetchError)
        return { success: false, error: `Image not found: ${fetchError.message}` }
      }

      if (!imageRecord) {
        return { success: false, error: 'Image not found' }
      }

      console.log('Found image record:', imageRecord)

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('tourism-images')
        .remove([imageRecord.image_path])

      if (storageError) {
        console.error('Error deleting from storage (continuing anyway):', storageError)
        // Don't fail the whole operation if storage delete fails
      }

      // Soft delete from database (set is_active = false)
      const { error: dbError } = await supabase
        .from('media_files')
        .update({ is_active: false })
        .eq('id', imageId)
        .eq('entity_type', 'tourism')

      if (dbError) {
        console.error('Error deleting image record from database:', dbError)
        return { success: false, error: `Failed to delete image record: ${dbError.message}` }
      }

      console.log('Successfully deleted image:', imageId)
      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in deleteTourismImage:', error)
      return { success: false, error: `Failed to delete image: ${error}` }
    }
  },

  /**
   * Update image details - USING MEDIA_FILES
   */
  async updateTourismImage(
    imageId: string, 
    updates: {
      altText?: string
      caption?: string
      imageType?: 'cover' | 'gallery' | 'featured'
      isFeatured?: boolean
      sortOrder?: number
    }
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('Updating tourism image:', imageId, 'with updates:', updates)

      const updateData: any = {}
      
      if (updates.altText !== undefined) updateData.alt_text = updates.altText
      if (updates.caption !== undefined) updateData.caption = updates.caption
      if (updates.imageType !== undefined) updateData.image_type = updates.imageType
      if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

      // Update using media_files table
      const { error } = await supabase
        .from('media_files')
        .update(updateData)
        .eq('id', imageId)
        .eq('entity_type', 'tourism')

      if (error) {
        console.error('Error updating image:', error)
        return { success: false, error: `Failed to update image: ${error.message}` }
      }

      console.log('Successfully updated image:', imageId)
      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateTourismImage:', error)
      return { success: false, error: `Failed to update image: ${error}` }
    }
  },

  /**
   * Get all tourism images with filters (for gallery page) - USING MEDIA_FILES
   */
  async getAllTourismImages(filters: {
    placeId?: string
    imageType?: 'cover' | 'gallery' | 'featured'
    isFeatured?: boolean
    limit?: number
  } = {}): Promise<{ data: TourismImage[] | null; error: any }> {
    try {
      let query = supabase
        .from('media_files')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .eq('entity_type', 'tourism')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (filters.placeId) {
        query = query.eq('entity_id', filters.placeId)
      }

      if (filters.imageType) {
        query = query.eq('image_type', filters.imageType)
      }

      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all tourism images:', error)
        return { data: null, error }
      }

      // Map media_files structure to TourismImage interface
      const images = (data || []).map(item => ({
        id: item.id,
        tourism_place_id: item.entity_id,
        image_url: item.url,
        image_path: item.image_path || '',
        alt_text: item.alt_text,
        caption: item.caption,
        image_type: item.image_type || 'gallery',
        is_featured: item.is_featured || false,
        sort_order: item.sort_order || 0,
        uploaded_by: item.uploaded_by,
        created_at: item.created_at,
        updated_at: item.created_at,
        uploader_name: item.profiles?.full_name,
        place_name: '', // Would need additional query to get place name
        place_slug: ''  // Would need additional query to get place slug
      }))

      return { data: images, error: null }

    } catch (error) {
      console.error('Unexpected error in getAllTourismImages:', error)
      return { data: null, error }
    }
  }
}

// Tourism Reviews Service
export const tourismReviewService = {
  /**
   * Get reviews for a tourism place
   */
  async getTourismPlaceReviews(placeId: string): Promise<{ data: TourismReview[] | null; error: any }> {
    try {
      // Get reviews using the simple view
      const { data: reviews, error: reviewsError } = await supabase
        .from('tourism_reviews')
        .select(`
          id,
          tourism_place_id,
          user_id,
          rating,
          title,
          content,
          visit_date,
          status,
          is_verified,
          created_at,
          updated_at
        `)
        .eq('tourism_place_id', placeId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching tourism reviews:', reviewsError)
        return { data: null, error: reviewsError }
      }

      if (!reviews || reviews.length === 0) {
        return { data: [], error: null }
      }

      // Get user info for all reviews
      const userIds = [...new Set(reviews.map(r => r.user_id))]
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      // Get all review images at once
      const reviewIds = reviews.map(r => r.id)
      const { data: allImages } = await supabase
        .from('media_files')
        .select('id, url, alt_text, caption, sort_order, entity_id')
        .eq('entity_type', 'tourism_review')
        .in('entity_id', reviewIds)
        .eq('is_active', true)
        .order('entity_id, sort_order')

      // Combine data
      const reviewsWithImages = reviews.map(review => {
        const user = users?.find(u => u.id === review.user_id)
        const reviewImages = allImages?.filter(img => img.entity_id === review.id) || []
        
        return {
          ...review,
          user_name: user?.full_name || null,
          user_email: user?.email || null,
          images: reviewImages.map(img => ({
            id: img.id,
            review_id: review.id,
            tourism_place_id: placeId,
            image_url: img.url,
            image_path: '',
            alt_text: img.alt_text,
            caption: img.caption,
            sort_order: img.sort_order,
            created_at: review.created_at
          }))
        }
      })

      return { data: reviewsWithImages, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismPlaceReviews:', error)
      return { data: null, error }
    }
  },

  /**
   * Submit review with images
   */
  async submitTourismReview(
    placeId: string,
    userId: string,
    reviewData: TourismReviewFormData,
    images?: File[]
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Check if user already reviewed this place - use direct table query
      const { data: existingReview } = await supabase
        .from('tourism_reviews')
        .select('id')
        .eq('tourism_place_id', placeId)
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors

      if (existingReview) {
        return { success: false, error: 'You have already reviewed this place' }
      }

      console.log('Creating review for place:', placeId, 'by user:', userId)

      // Insert review
      const { data: review, error: reviewError } = await supabase
        .from('tourism_reviews')
        .insert([
          {
            tourism_place_id: placeId,
            user_id: userId,
            rating: reviewData.rating,
            title: reviewData.title || null,
            content: reviewData.content || null,
            visit_date: reviewData.visitDate || null,
            status: 'published'
          }
        ])
        .select()
        .single()

      if (reviewError) {
        console.error('Error creating review:', reviewError)
        return { success: false, error: 'Failed to submit review' }
      }

      console.log('Review created successfully:', review.id)

      // Upload images if provided - use media_files table
      if (images && images.length > 0) {
        console.log(`Uploading ${images.length} images for review:`, review.id)
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${userId}/${Date.now()}-${i}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `reviews/${placeId}/${fileName}`

          console.log(`Uploading image ${i + 1}:`, filePath)

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tourism-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from('tourism-images')
              .getPublicUrl(filePath)

            console.log(`Saving image ${i + 1} to media_files:`, urlData.publicUrl)

            // Insert into media_files table
            const { error: mediaError } = await supabase
              .from('media_files')
              .insert([
                {
                  url: urlData.publicUrl,
                  image_path: filePath,
                  file_name: file.name,
                  file_size: file.size,
                  mime_type: file.type,
                  sort_order: i,
                  entity_type: 'tourism_review',
                  entity_id: review.id,
                  uploaded_by: userId,
                  is_active: true
                }
              ])

            if (mediaError) {
              console.error(`Error saving image ${i + 1} to media_files:`, mediaError)
            } else {
              console.log(`Image ${i + 1} saved successfully`)
            }
          } else {
            console.error(`Error uploading image ${i + 1}:`, uploadError)
          }
        }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in submitTourismReview:', error)
      return { success: false, error: 'Failed to submit review' }
    }
  },

  /**
   * Get review statistics for a tourism place
   */
  async getTourismReviewStats(placeId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tourism_reviews')
        .select('rating')
        .eq('tourism_place_id', placeId)
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching review stats:', error)
        return { data: null, error }
      }

      const reviews = data || []
      const totalReviews = reviews.length

      if (totalReviews === 0) {
        return {
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          error: null
        }
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / totalReviews

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++
      })

      return {
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution
        },
        error: null
      }

    } catch (error) {
      console.error('Unexpected error in getTourismReviewStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Get all review images (for gallery page) - USING MEDIA_FILES
   */
  async getAllReviewImages(filters: {
    placeId?: string
    limit?: number
  } = {}): Promise<{ data: TourismReviewImage[] | null; error: any }> {
    try {
      let query = supabase
        .from('media_files')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .eq('entity_type', 'tourism_review')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching review images:', error)
        return { data: null, error }
      }

      // If placeId filter is needed, we need to join with tourism_reviews
      let filteredData = data || []
      if (filters.placeId) {
        const reviewIds: any[] = []
        for (const image of filteredData) {
          const { data: review } = await supabase
            .from('tourism_reviews')
            .select('tourism_place_id')
            .eq('id', image.entity_id)
            .single()
          
          if (review && review.tourism_place_id === filters.placeId) {
            reviewIds.push(image.entity_id)
          }
        }
        filteredData = filteredData.filter(image => reviewIds.includes(image.entity_id))
      }

      // Map to TourismReviewImage interface
      const reviewImages = filteredData.map(item => ({
        id: item.id,
        review_id: item.entity_id,
        tourism_place_id: '', // Would need additional query
        image_url: item.url,
        image_path: item.image_path || '',
        alt_text: item.alt_text,
        caption: item.caption,
        sort_order: item.sort_order || 0,
        created_at: item.created_at
      }))

      return { data: reviewImages, error: null }

    } catch (error) {
      console.error('Unexpected error in getAllReviewImages:', error)
      return { data: null, error }
    }
  }
}