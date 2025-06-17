// src/lib/database.ts - Enhanced with Category & Area Filtering
// Professional database service layer for clean, maintainable code

import { supabase } from './supabase'

// Types for better type safety
export interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string[] | null
  email: string | null
  website: string | null
  status: 'pending' | 'published' | 'rejected' | 'suspended'
  is_featured: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  owner_id: string | null
  city_id: string | null
  area_id: string | null
  established_year: number | null
  employee_count: '1-10' | '11-50' | '51-200' | '200+' | null
  whatsapp: string | null
  // Related data
  city_name?: string
  area_name?: string | null
  owner_email?: string
  owner_name?: string | null
  categories?: Category[] // Add categories to business interface
}

export interface BusinessFilters {
  status?: 'all' | 'pending' | 'published' | 'rejected' | 'suspended'
  search?: string
  limit?: number
  cityId?: string
  areaId?: string
  categoryId?: string // Add category filtering
  categorySlug?: string // Add category slug filtering
  ownerId?: string
}

export interface BusinessCounts {
  total: number
  pending: number
  published: number
  rejected: number
  suspended: number
}

export interface BusinessOwnerStats {
  totalBusinesses: number
  publishedBusinesses: number
  pendingBusinesses: number
  totalReviews: number
  averageRating: number
}

// Form-specific types
export interface City {
  id: string
  name: string
  slug: string
}

export interface Area {
  id: string
  name: string
  slug: string
  city_id: string
}

export interface Category {
  id: string
  name: string
  slug: string
  feature_type: string
  description?:string
}

export interface BusinessFormData {
  name: string
  description: string
  address: string
  city_id: string
  area_id?: string
  phone: string[]
  email?: string
  website?: string
  whatsapp?: string
  established_year?: number
  employee_count?: '1-10' | '11-50' | '51-200' | '200+'
  category_ids: string[]
}

// Enhanced Review interface - update existing one
export interface Review {
  id: string
  business_id: string
  user_id: string
  rating: number
  title: string | null
  content: string | null
  status: 'pending' | 'published' | 'rejected'
  is_verified: boolean
  created_at: string
  updated_at: string
  edit_count: number  // NEW
  edited_at: string | null  // NEW
  is_deleted: boolean  // NEW
  // Related data
  user_name?: string
  user_email?: string
  reply?: ReviewReply | null
}

export interface ReviewReply {
  id: string
  review_id: string
  business_id: string
  content: string
  replied_by: string
  created_at: string
  updated_at: string
  replier_name?: string
}

export interface ReviewFormData {
  rating: number
  title: string
  content: string
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

// Business Service - All business-related database operations
export const businessService = {
  /**
   * Get businesses with optional filters and relationships
   * Enhanced with category and area filtering support
   */
  async getBusinesses(filters: BusinessFilters = {}): Promise<{ data: Business[] | null; error: any }> {
    try {
      let query = supabase
        .from('businesses')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          profiles:owner_id(full_name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply basic filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.search?.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`)
      }

      if (filters.cityId) {
        query = query.eq('city_id', filters.cityId)
      }

      if (filters.areaId) {
        query = query.eq('area_id', filters.areaId)
      }

      // Filter by owner for business dashboard
      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching businesses:', error)
        return { data: null, error }
      }

      let businesses: Business[] = (data || []).map(item => ({
        ...item,
        city_name: item.cities?.name || 'Unknown City',
        area_name: item.areas?.name || null,
        owner_email: item.profiles?.email || 'Unknown Owner',
        owner_name: item.profiles?.full_name || null
      }))

      // Category filtering (many-to-many relationship)
      if (filters.categoryId || filters.categorySlug) {
        const categoryFilteredBusinesses = await this.filterBusinessesByCategory(
          businesses, 
          filters.categoryId, 
          filters.categorySlug
        )
        businesses = categoryFilteredBusinesses
      }

      return { data: businesses, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinesses:', error)
      return { data: null, error }
    }
  },

  /**
   * Filter businesses by category (handles many-to-many relationship)
   */
  async filterBusinessesByCategory(
    businesses: Business[], 
    categoryId?: string, 
    categorySlug?: string
  ): Promise<Business[]> {
    try {
      let targetCategoryId = categoryId

      // If we have slug but no ID, find the category ID
      if (categorySlug && !categoryId) {
        const { data: categories } = await categoryService.getBusinessCategories()
        const category = categories?.find(cat => cat.slug === categorySlug)
        if (!category) {
          return [] // Category not found
        }
        targetCategoryId = category.id
      }

      if (!targetCategoryId) {
        return businesses
      }

      // Get business IDs that belong to this category
      const { data: businessCategories, error } = await supabase
        .from('business_categories')
        .select('business_id')
        .eq('category_id', targetCategoryId)

      if (error) {
        console.error('Error fetching business categories:', error)
        return businesses // Return all businesses if category fetch fails
      }

      const categoryBusinessIds = new Set(
        businessCategories?.map(bc => bc.business_id) || []
      )

      // Filter businesses to only include those in the category
      return businesses.filter(business => categoryBusinessIds.has(business.id))

    } catch (error) {
      console.error('Error filtering businesses by category:', error)
      return businesses // Return all businesses if filtering fails
    }
  },

  /**
   * Get businesses by category slug (optimized method)
   */
  async getBusinessesByCategory(categorySlug: string): Promise<{ data: Business[] | null; error: any }> {
    return this.getBusinesses({
      status: 'published',
      categorySlug: categorySlug,
      limit: 1000
    })
  },

  /**
   * Get businesses by area ID (already working)
   */
  async getBusinessesByArea(areaId: string): Promise<{ data: Business[] | null; error: any }> {
    return this.getBusinesses({
      status: 'published',
      areaId: areaId,
      limit: 1000
    })
  },

  /**
   * Get business by ID with relationships
   */
  async getBusinessById(id: string): Promise<{ data: Business | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          profiles:owner_id(full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching business by ID:', error)
        return { data: null, error }
      }

      const business: Business = {
        ...data,
        city_name: data.cities?.name || 'Unknown City',
        area_name: data.areas?.name || null,
        owner_email: data.profiles?.email || 'Unknown Owner',
        owner_name: data.profiles?.full_name || null
      }

      return { data: business, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessById:', error)
      return { data: null, error }
    }
  },

  /**
   * Update business status (admin function)
   */
  async updateStatus(id: string, status: Business['status']): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating business status:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateStatus:', error)
      return { success: false, error }
    }
  },

  /**
   * Get business counts by status (for admin)
   */
  async getCounts(): Promise<{ data: BusinessCounts | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('status')

      if (error) {
        console.error('Error getting business counts:', error)
        return { data: null, error }
      }

      const counts: BusinessCounts = {
        total: data?.length || 0,
        pending: data?.filter(b => b.status === 'pending').length || 0,
        published: data?.filter(b => b.status === 'published').length || 0,
        rejected: data?.filter(b => b.status === 'rejected').length || 0,
        suspended: data?.filter(b => b.status === 'suspended').length || 0
      }

      return { data: counts, error: null }

    } catch (error) {
      console.error('Unexpected error in getCounts:', error)
      return { data: null, error }
    }
  },

  /**
   * Get business owner stats (for business dashboard)
   */
  async getOwnerStats(ownerId: string): Promise<{ data: BusinessOwnerStats | null; error: any }> {
    try {
      // Get business counts for this owner
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('status')
        .eq('owner_id', ownerId)

      if (businessError) {
        console.error('Error getting owner business counts:', businessError)
        return { data: null, error: businessError }
      }

      // Get review stats for this owner's businesses
      const { data: businessIds } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', ownerId)

      let totalReviews = 0
      let averageRating = 0

      if (businessIds && businessIds.length > 0) {
        const businessIdList = businessIds.map(b => b.id)
        
        const { data: reviews, error: reviewError } = await supabase
          .from('business_reviews')
          .select('rating')
          .in('business_id', businessIdList)
          .eq('status', 'published')

        if (!reviewError && reviews) {
          totalReviews = reviews.length
          if (totalReviews > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
            averageRating = Math.round((totalRating / totalReviews) * 10) / 10 // Round to 1 decimal
          }
        }
      }

      const stats: BusinessOwnerStats = {
        totalBusinesses: businesses?.length || 0,
        publishedBusinesses: businesses?.filter(b => b.status === 'published').length || 0,
        pendingBusinesses: businesses?.filter(b => b.status === 'pending').length || 0,
        totalReviews,
        averageRating
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('Unexpected error in getOwnerStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Get recent businesses (for dashboard)
   */
  async getRecent(limit: number = 5): Promise<{ data: Business[] | null; error: any }> {
    return this.getBusinesses({ limit })
  },

  /**
   * Create new business (enhanced for form submission)
   */
  async create(formData: BusinessFormData, ownerId: string): Promise<{ data: Business | null; error: any }> {
    try {
      // Generate slug from business name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Prepare business data
      const businessData = {
        name: formData.name.trim(),
        slug: slug,
        description: formData.description.trim() || null,
        address: formData.address.trim(),
        city_id: formData.city_id,
        area_id: formData.area_id || null,
        phone: formData.phone.filter(p => p.trim()).length > 0 ? formData.phone.filter(p => p.trim()) : null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        whatsapp: formData.whatsapp?.trim() || null,
        established_year: formData.established_year || null,
        employee_count: formData.employee_count || null,
        owner_id: ownerId,
        status: 'pending' as const,
        is_featured: false,
        is_verified: false
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single()

      if (error) {
        console.error('Error creating business:', error)
        return { data: null, error }
      }

      // Add business categories if provided
      if (formData.category_ids.length > 0) {
        const categoryData = formData.category_ids.map(categoryId => ({
          business_id: data.id,
          category_id: categoryId,
          is_primary: false // First category could be marked as primary
        }))

        const { error: categoryError } = await supabase
          .from('business_categories')
          .insert(categoryData)

        if (categoryError) {
          console.error('Error adding business categories:', categoryError)
          // Don't fail the whole operation for category errors
        }
      }

      // Auto-promote user to business_owner if they're just a regular user
      const { data: currentRole } = await userService.getCurrentUserRole(ownerId)
      if (currentRole === 'user') {
        await userService.updateRole(ownerId, 'business_owner')
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in create:', error)
      return { data: null, error }
    }
  },

  /**
   * Update business details
   */
  async update(id: string, updates: Partial<Business>): Promise<{ data: Business | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating business:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in update:', error)
      return { data: null, error }
    }
  },

  /**
   * Delete business (admin function)
   */
  async delete(id: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting business:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in delete:', error)
      return { success: false, error }
    }
  }
}

// Location Service - For form dropdowns
export const locationService = {
  /**
   * Get all active cities
   */
  async getCities(): Promise<{ data: City[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching cities:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getCities:', error)
      return { data: null, error }
    }
  },

  /**
   * Get areas by city ID
   */
  async getAreasByCity(cityId: string): Promise<{ data: Area[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, slug, city_id')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching areas:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getAreasByCity:', error)
      return { data: null, error }
    }
  },

  /**
   * Get area by slug (enhanced for area page)
   */
  async getAreaBySlug(slug: string): Promise<{ data: { area: Area; city: City } | null; error: any }> {
    try {
      // Get all cities and their areas to find the matching slug
      const { data: cities, error: citiesError } = await this.getCities()
      
      if (citiesError || !cities) {
        return { data: null, error: citiesError }
      }

      for (const city of cities) {
        const { data: areas, error: areasError } = await this.getAreasByCity(city.id)
        
        if (!areasError && areas) {
          const matchingArea = areas.find(a => a.slug === slug)
          if (matchingArea) {
            return { 
              data: { area: matchingArea, city }, 
              error: null 
            }
          }
        }
      }

      return { data: null, error: 'Area not found' }

    } catch (error) {
      console.error('Unexpected error in getAreaBySlug:', error)
      return { data: null, error }
    }
  }
}

// Category Service - For form categories
export const categoryService = {
  /**
   * Get business categories
   */
  async getBusinessCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, feature_type')
        .eq('feature_type', 'business')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessCategories:', error)
      return { data: null, error }
    }
  },

  /**
   * Get category by slug (enhanced for category page)
   */
  async getCategoryBySlug(slug: string): Promise<{ data: Category | null; error: any }> {
    try {
      const { data: categories, error } = await this.getBusinessCategories()
      
      if (error) {
        return { data: null, error }
      }

      const category = categories?.find(cat => cat.slug === slug)
      
      return { 
        data: category || null, 
        error: category ? null : 'Category not found' 
      }

    } catch (error) {
      console.error('Unexpected error in getCategoryBySlug:', error)
      return { data: null, error }
    }
  }
}

// User Service - All user-related database operations
export const userService = {
  /**
   * Get user count
   */
  async getCount(): Promise<{ data: number | null; error: any }> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })

      if (error) {
        console.error('Error getting user count:', error)
        return { data: null, error }
      }

      return { data: count || 0, error: null }

    } catch (error) {
      console.error('Unexpected error in getCount:', error)
      return { data: null, error }
    }
  },

  /**
   * Update user role (admin function)
   */
  async updateRole(userId: string, userType: 'user' | 'business_owner' | 'admin'): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: userType })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateRole:', error)
      return { success: false, error }
    }
  },

  /**
   * Get current user role
   */
  async getCurrentUserRole(userId: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data: data.user_type || 'user', error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Review Service - Add this to your existing database.ts
export const reviewService = {
  /**
   * Get reviews for a business with user info and replies
   */
  async getBusinessReviews(businessId: string): Promise<{ data: Review[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reviews') // This should be a view: CREATE VIEW public.reviews AS SELECT * FROM business_directory.reviews
        .select(`
          *,
          profiles:user_id(full_name, email),
          review_replies:review_replies(
            id,
            content,
            created_at,
            updated_at,
            profiles:replied_by(full_name)
          )
        `)
        .eq('business_id', businessId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching business reviews:', error)
        return { data: null, error }
      }

      // Transform data to match our interface
      const reviews: Review[] = (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.full_name || null,
        user_email: item.profiles?.email || null,
        reply: item.review_replies && item.review_replies.length > 0 ? {
          ...item.review_replies[0],
          replier_name: item.review_replies[0].profiles?.full_name || null
        } : null
      }))

      return { data: reviews, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessReviews:', error)
      return { data: null, error }
    }
  },

  /**
   * Get review statistics for a business
   */
  async getReviewStats(businessId: string): Promise<{ data: ReviewStats | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('business_id', businessId)
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

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / totalReviews

      // Calculate rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++
      })

      const stats: ReviewStats = {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('Unexpected error in getReviewStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Submit a new review
   */
  async submitReview(
    businessId: string, 
    userId: string, 
    reviewData: ReviewFormData
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Check if user already reviewed this business
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing review:', checkError)
        return { success: false, error: 'Failed to check existing review' }
      }

      if (existingReview) {
        return { success: false, error: 'You have already reviewed this business' }
      }

      // Insert new review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert([
          {
            business_id: businessId,
            user_id: userId,
            rating: reviewData.rating,
            title: reviewData.title.trim() || null,
            content: reviewData.content.trim(),
            status: 'published', // reviews will get publish instantly
            is_verified: false
          }
        ])

      if (insertError) {
        console.error('Error inserting review:', insertError)
        return { success: false, error: 'Failed to submit review' }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in submitReview:', error)
      return { success: false, error: 'Failed to submit review' }
    }
  },

  /**
   * Get all reviews for admin management
   */
  async getAllReviews(filters: {
    status?: 'all' | 'pending' | 'published' | 'rejected'
    businessId?: string
    limit?: number
  } = {}): Promise<{ data: Review[] | null; error: any }> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id(full_name, email),
          businesses:business_id(name, slug)
        `)
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.businessId) {
        query = query.eq('business_id', filters.businessId)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all reviews:', error)
        return { data: null, error }
      }

      // Transform data
      const reviews: Review[] = (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.full_name || null,
        user_email: item.profiles?.email || null,
        business_name: item.businesses?.name || null,
        business_slug: item.businesses?.slug || null
      }))

      return { data: reviews, error: null }

    } catch (error) {
      console.error('Unexpected error in getAllReviews:', error)
      return { data: null, error }
    }
  },

  /**
   * Update review status (admin function)
   */
  async updateReviewStatus(
    reviewId: string, 
    status: 'pending' | 'published' | 'rejected'
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) {
        console.error('Error updating review status:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateReviewStatus:', error)
      return { success: false, error }
    }
  },

  /**
   * Update an existing review (with edit limits)
   */
  async updateReview(
    reviewId: string,
    userId: string,
    reviewData: ReviewFormData
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Get current review to check edit count and ownership
      const { data: currentReview, error: fetchError } = await supabase
        .from('reviews')
        .select('edit_count, user_id')
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        console.error('Error fetching current review:', fetchError)
        return { success: false, error: 'Review not found' }
      }

      // Check ownership
      if (currentReview.user_id !== userId) {
        return { success: false, error: 'You can only edit your own reviews' }
      }

      // Check edit limit (max 2 edits)
      if (currentReview.edit_count >= 2) {
        return { success: false, error: 'You have reached the maximum edit limit (2 edits)' }
      }

      // Update review
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          rating: reviewData.rating,
          title: reviewData.title.trim() || null,
          content: reviewData.content.trim(),
          edit_count: currentReview.edit_count + 1,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (updateError) {
        console.error('Error updating review:', updateError)
        return { success: false, error: 'Failed to update review' }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in updateReview:', error)
      return { success: false, error: 'Failed to update review' }
    }
  },

  /**
   * Soft delete a review
   */
  async deleteReview(
    reviewId: string,
    userId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Get current review to check ownership
      const { data: currentReview, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (fetchError) {
        console.error('Error fetching current review:', fetchError)
        return { success: false, error: 'Review not found' }
      }

      // Check ownership
      if (currentReview.user_id !== userId) {
        return { success: false, error: 'You can only delete your own reviews' }
      }

      // Soft delete
      const { error: deleteError } = await supabase
        .from('reviews')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (deleteError) {
        console.error('Error deleting review:', deleteError)
        return { success: false, error: 'Failed to delete review' }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in deleteReview:', error)
      return { success: false, error: 'Failed to delete review' }
    }
  },

  /**
   * Check if user can edit a review (ownership + edit limit)
   */
  async canEditReview(reviewId: string, userId: string): Promise<{ canEdit: boolean; editCount: number }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('user_id, edit_count')
        .eq('id', reviewId)
        .single()

      if (error || !data) {
        return { canEdit: false, editCount: 0 }
      }

      const canEdit = data.user_id === userId && data.edit_count < 2
      return { canEdit, editCount: data.edit_count }

    } catch (error) {
      console.error('Error checking edit permission:', error)
      return { canEdit: false, editCount: 0 }
    }
  },


 /**
 * Add business reply to review
 */
async addReviewReply(
  reviewId: string,
  businessId: string,
  replierId: string,
  content: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if reply already exists
    const { data: existingReply, error: checkError } = await supabase
      .from('review_replies')
      .select('id')
      .eq('review_id', reviewId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing reply:', checkError)
      return { success: false, error: 'Failed to check existing reply' }
    }

    if (existingReply) {
      return { success: false, error: 'Reply already exists for this review' }
    }

    // Verify the replier owns the business
    const isOwner = await businessOwnerService.isBusinessOwner(replierId, businessId)
    if (!isOwner) {
      return { success: false, error: 'Only business owners can reply to reviews' }
    }

    // Insert reply
    const { error: insertError } = await supabase
      .from('review_replies')
      .insert([
        {
          review_id: reviewId,
          business_id: businessId,
          replied_by: replierId,
          content: content.trim()
        }
      ])

    if (insertError) {
      console.error('Error inserting review reply:', insertError)
      return { success: false, error: 'Failed to add reply' }
    }

    return { success: true, error: null }

  } catch (error) {
    console.error('Unexpected error in addReviewReply:', error)
    return { success: false, error: 'Failed to add reply' }
  }
},

  /**
   * Get review counts by status (for admin dashboard)
   */
  async getReviewCounts(): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('status')

      if (error) {
        console.error('Error getting review counts:', error)
        return { data: null, error }
      }

      const counts = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        published: data?.filter(r => r.status === 'published').length || 0,
        rejected: data?.filter(r => r.status === 'rejected').length || 0
      }

      return { data: counts, error: null }

    } catch (error) {
      console.error('Unexpected error in getReviewCounts:', error)
      return { data: null, error }
    }
  }
}

// Business Owner Service - Add this new service
export const businessOwnerService = {
  /**
   * Check if user owns a specific business
   */
  async isBusinessOwner(userId: string, businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()
      
      if (error || !data) {
        return false
      }
      
      return data.owner_id === userId
    } catch (error) {
      console.error('Error checking business ownership:', error)
      return false
    }
  },

  /**
   * Get businesses owned by user
   */
  async getUserBusinesses(userId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .eq('owner_id', userId)
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching user businesses:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getUserBusinesses:', error)
      return { data: null, error }
    }
  }
}

// Update the main export to include businessOwnerService
export default {
  business: businessService,
  location: locationService,
  category: categoryService,
  user: userService,
  review: reviewService,
  businessOwner: businessOwnerService  // Add this line
}