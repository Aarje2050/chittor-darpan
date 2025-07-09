// src/lib/services/business.ts - FIXED VERSION with Category Join
import { supabase } from '../supabase'

// Types for business services
export interface Business {
  category_name: any
  category_id?: string[] // For filtering by category
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string[] | null
  email: string | null
  website: string | null
  status: 'published' | 'rejected' | 'suspended' | 'pending'
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
  average_rating?: number | null
  total_reviews?: number | null

  //images
  cover_image_url?: string | null
  logo_url?: string | null
  gallery_images?: string[] | null
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
  // Image URLs
  logo_url?: string
  cover_image_url?: string
  gallery_images?: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  feature_type: string
  description?: string
}

// Business Service - All business-related database operations
export const businessService = {
  /**
   * Get businesses with optional filters and relationships
   * FIXED: Now includes category information through many-to-many relationship
   */
  async getBusinesses(filters: BusinessFilters = {}): Promise<{ data: Business[] | null; error: any }> {
    try {
      console.log('🔍 Fetching businesses with categories...')
      
      let query = supabase
        .from('businesses')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          profiles:owner_id(full_name, email),
          business_categories(
            categories(
              id,
              name,
              slug
            )
          )
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
        console.error('❌ Error fetching businesses:', error)
        return { data: null, error }
      }

      console.log('✅ Raw data fetched, processing categories...')

      let businesses: Business[] = (data || []).map(item => {
        // Extract first category name from the many-to-many relationship
        let category_name = null
        
        if (item.business_categories && item.business_categories.length > 0) {
          const firstCategory = item.business_categories[0]?.categories
          if (firstCategory) {
            category_name = firstCategory.name
          }
        }

        console.log(`📋 Business: ${item.name} -> Category: ${category_name || 'NO CATEGORY'}`)

        return {
          ...item,
          city_name: item.cities?.name || 'Unknown City',
          area_name: item.areas?.name || null,
          owner_email: item.profiles?.email || 'Unknown Owner',
          owner_name: item.profiles?.full_name || null,
          category_name: category_name // ✅ NOW WE HAVE CATEGORY NAME!
        }
      })

      // Category filtering (if needed)
      if (filters.categoryId || filters.categorySlug) {
        const categoryFilteredBusinesses = await this.filterBusinessesByCategory(
          businesses, 
          filters.categoryId, 
          filters.categorySlug
        )
        businesses = categoryFilteredBusinesses
      }

      console.log(`🎉 Successfully processed ${businesses.length} businesses with categories`)
      return { data: businesses, error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getBusinesses:', error)
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
        // Import categoryService to avoid circular dependency
        const { categoryService } = await import('./category')
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
   * FIXED: Now includes category information
   */
  async getBusinessById(id: string): Promise<{ data: Business | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          cities:city_id(name),
          areas:area_id(name),
          profiles:owner_id(full_name, email),
          business_categories(
            categories(
              id,
              name,
              slug
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching business by ID:', error)
        return { data: null, error }
      }

      // Extract first category name
      let category_name = null
      if (data.business_categories && data.business_categories.length > 0) {
        const firstCategory = data.business_categories[0]?.categories
        if (firstCategory) {
          category_name = firstCategory.name
        }
      }

      const business: Business = {
        ...data,
        city_name: data.cities?.name || 'Unknown City',
        area_name: data.areas?.name || null,
        owner_email: data.profiles?.email || 'Unknown Owner',
        owner_name: data.profiles?.full_name || null,
        category_name: category_name
      }

      return { data: business, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessById:', error)
      return { data: null, error }
    }
  },

  /**
   * Get recent businesses with review stats (for homepage)
   */
  async getRecentBusinessesWithReviews(limit: number = 12): Promise<{ data: Business[] | null; error: any }> {
    try {
      const { data: businesses, error } = await this.getBusinesses({
        status: 'published',
        limit: limit * 2 // Get more to filter later
      })

      if (error || !businesses) {
        return { data: null, error }
      }

      // Get review stats for each business
      const businessesWithReviews = await Promise.all(
        businesses.map(async (business) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('business_id', business.id)
            .eq('status', 'published')

          let average_rating = null
          let total_reviews = 0

          if (reviews && reviews.length > 0) {
            total_reviews = reviews.length
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
            average_rating = Math.round((totalRating / total_reviews) * 10) / 10
          }

          return {
            ...business,
            average_rating,
            total_reviews
          }
        })
      )

      // Sort by creation date and limit
      const sortedBusinesses = businessesWithReviews
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)

      return { data: sortedBusinesses, error: null }

    } catch (error) {
      console.error('Unexpected error in getRecentBusinessesWithReviews:', error)
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
      // Generate unique slug
      let baseSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check for existing slug and make it unique
      let slug = baseSlug
      let counter = 1
      let slugExists = true

      while (slugExists) {
        const { data: existingBusiness } = await supabase
          .from('businesses')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle()

        if (!existingBusiness) {
          slugExists = false
        } else {
          slug = `${baseSlug}-${counter}`
          counter++
        }
      }

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
        is_verified: false,
        // Image URLs
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        gallery_images: formData.gallery_images && formData.gallery_images.length > 0 ? formData.gallery_images : null
      }

      console.log('Creating business with image URLs:', {
        logo_url: businessData.logo_url,
        cover_image_url: businessData.cover_image_url,
        gallery_images: businessData.gallery_images
      })

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
      const { userService } = await import('./user')
      const { data: currentRole } = await userService.getUserProfile(ownerId)
      if (currentRole && currentRole.user_type === 'user') {
        await userService.updateUserRole(ownerId, 'business_owner')
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