// src/lib/database.ts - Enhanced with separate service imports
// Professional database service layer for clean, maintainable code

import { supabase } from './supabase'

// Import separate services
import { 
  tourismService, 
  tourismImageService, 
  tourismReviewService,
  type TourismPlace,
  type TourismFormData,
  type TourismCounts,
  type TourismImage,
  type TourismReview,
  type TourismReviewImage,
  type TourismReviewFormData
} from './services/tourism'

import { 
  userService as userServiceImport,
  type UserProfile,
  type UserStats,
  type UserActivityItem,
  type ProfileUpdateData
} from './services/user'

import { 
  reviewService as reviewServiceImport,
  type Review,
  type ReviewReply,
  type ReviewFormData,
  type ReviewStats
} from './services/reviews'

// Types for business services (keep existing)
export interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string[] | null
  email: string | null
  website: string | null
  status:  'published' | 'rejected' | 'suspended' | 'pending'
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
  categories?: Category[]
}

export interface BusinessFilters {
  status?: 'all' | 'pending' | 'published' | 'rejected' | 'suspended'
  search?: string
  limit?: number
  cityId?: string
  areaId?: string
  categoryId?: string
  categorySlug?: string
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

export interface City {
  id: string
  name: string
  slug: string
  state?: string
}

export interface Area {
  id: string
  name: string
  slug: string
  city_id: string
  description?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  feature_type: string
  description?: string
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

// Business Service - All business-related database operations
export const businessService = {
  /**
   * Get businesses with optional filters and relationships
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

      if (categorySlug && !categoryId) {
        const { data: categories } = await categoryService.getBusinessCategories()
        const category = categories?.find(cat => cat.slug === categorySlug)
        if (!category) {
          return []
        }
        targetCategoryId = category.id
      }

      if (!targetCategoryId) {
        return businesses
      }

      const { data: businessCategories, error } = await supabase
        .from('business_categories')
        .select('business_id')
        .eq('category_id', targetCategoryId)

      if (error) {
        console.error('Error fetching business categories:', error)
        return businesses
      }

      const categoryBusinessIds = new Set(
        businessCategories?.map(bc => bc.business_id) || []
      )

      return businesses.filter(business => categoryBusinessIds.has(business.id))

    } catch (error) {
      console.error('Error filtering businesses by category:', error)
      return businesses
    }
  },

  /**
   * Get businesses by category slug
   */
  async getBusinessesByCategory(categorySlug: string): Promise<{ data: Business[] | null; error: any }> {
    return this.getBusinesses({
      status: 'published',
      categorySlug: categorySlug,
      limit: 1000
    })
  },

  /**
   * Get businesses by area ID
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
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('status')
        .eq('owner_id', ownerId)

      if (businessError) {
        console.error('Error getting owner business counts:', businessError)
        return { data: null, error: businessError }
      }

      const { data: businessIds } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', ownerId)

      let totalReviews = 0
      let averageRating = 0

      if (businessIds && businessIds.length > 0) {
        const businessIdList = businessIds.map(b => b.id)
        
        const { data: reviews, error: reviewError } = await supabase
          .from('reviews')
          .select('rating')
          .in('business_id', businessIdList)
          .eq('status', 'published')

        if (!reviewError && reviews) {
          totalReviews = reviews.length
          if (totalReviews > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
            averageRating = Math.round((totalRating / totalReviews) * 10) / 10
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
   * Create new business
   */
  async create(formData: BusinessFormData, ownerId: string): Promise<{ data: Business | null; error: any }> {
    try {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

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

      if (formData.category_ids.length > 0) {
        const categoryData = formData.category_ids.map(categoryId => ({
          business_id: data.id,
          category_id: categoryId,
          is_primary: false
        }))

        const { error: categoryError } = await supabase
          .from('business_categories')
          .insert(categoryData)

        if (categoryError) {
          console.error('Error adding business categories:', categoryError)
        }
      }

      // Auto-promote user to business_owner if they're just a regular user
      const { data: currentRole } = await userServiceImport.getUserProfile(ownerId)
      if (currentRole && currentRole.user_type === 'user') {
        await userServiceImport.updateUserRole(ownerId, 'business_owner')
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
   * Get area by slug
   */
  async getAreaBySlug(slug: string): Promise<{ data: { area: Area; city: City } | null; error: any }> {
    try {
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
   * Get category by slug
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

// Business Owner Service
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

// Re-export imported services
export const userService = userServiceImport
export const reviewService = reviewServiceImport

// Export all services and types
export {
  tourismService,
  tourismImageService,
  tourismReviewService
}

export type {
  // Tourism types
  TourismPlace,
  TourismFormData,
  TourismCounts,
  TourismImage,
  TourismReview,
  TourismReviewImage,
  TourismReviewFormData,
  // User types
  UserProfile,
  UserStats,
  UserActivityItem,
  ProfileUpdateData,
  // Review types
  Review,
  ReviewReply,
  ReviewFormData,
  ReviewStats
}

// Main export for convenience
export default {
  business: businessService,
  location: locationService,
  category: categoryService,
  user: userService,
  review: reviewService,
  businessOwner: businessOwnerService,
  tourism: tourismService,
  tourismImage: tourismImageService,
  tourismReview: tourismReviewService
}