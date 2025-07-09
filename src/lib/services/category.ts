// src/lib/services/category.ts - Category Service Layer
import { supabase } from '../supabase'

export interface Category {
  id: string
  name: string
  slug: string
  feature_type: string
  description?: string
  is_active?: boolean
  sort_order?: number
  icon_name?: string  // Matches your actual column
  parent_id?: string | null
  created_at?: string
}

export interface CategoryWithStats extends Category {
  business_count?: number
  tourism_count?: number
}

// Category Service - For form categories and filtering
export const categoryService = {
  /**
   * Get business categories
   */
  async getBusinessCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      console.log('🔍 Fetching business categories...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .eq('feature_type', 'business')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('❌ Error fetching business categories:', error)
        return { data: null, error }
      }

      console.log('✅ Successfully fetched', data?.length || 0, 'business categories')
      return { data: data || [], error: null }

    } catch (error) {
      console.error('💥 Unexpected error in getBusinessCategories:', error)
      return { data: null, error }
    }
  },

  /**
   * Get tourism categories
   */
  async getTourismCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .eq('feature_type', 'tourism')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

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
   * Get all categories by feature type
   */
  async getCategoriesByType(featureType: 'business' | 'tourism' | 'job' | 'event'): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .eq('feature_type', featureType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error(`Error fetching ${featureType} categories:`, error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error(`Unexpected error in getCategoriesByType for ${featureType}:`, error)
      return { data: null, error }
    }
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string, featureType?: string): Promise<{ data: Category | null; error: any }> {
    try {
      let query = supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .eq('slug', slug)
        .eq('is_active', true)

      if (featureType) {
        query = query.eq('feature_type', featureType)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching category by slug:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getCategoryBySlug:', error)
      return { data: null, error }
    }
  },

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<{ data: Category | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .eq('id', categoryId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching category by ID:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getCategoryById:', error)
      return { data: null, error }
    }
  },

  /**
   * Get business categories with business counts
   */
  async getBusinessCategoriesWithStats(): Promise<{ data: CategoryWithStats[] | null; error: any }> {
    try {
      const { data: categories, error } = await this.getBusinessCategories()

      if (error || !categories) {
        return { data: null, error }
      }

      // Get business counts for each category
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('business_categories')
            .select('business_id', { count: 'exact', head: true })
            .eq('category_id', category.id)

          return {
            ...category,
            business_count: count || 0
          }
        })
      )

      return { data: categoriesWithStats, error: null }

    } catch (error) {
      console.error('Unexpected error in getBusinessCategoriesWithStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Get tourism categories with place counts
   */
  async getTourismCategoriesWithStats(): Promise<{ data: CategoryWithStats[] | null; error: any }> {
    try {
      const { data: categories, error } = await this.getTourismCategories()

      if (error || !categories) {
        return { data: null, error }
      }

      // Get tourism place counts for each category
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('tourism_places')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published')

          return {
            ...category,
            tourism_count: count || 0
          }
        })
      )

      return { data: categoriesWithStats, error: null }

    } catch (error) {
      console.error('Unexpected error in getTourismCategoriesWithStats:', error)
      return { data: null, error }
    }
  },

  /**
   * Search categories by name
   */
  async searchCategories(query: string, featureType?: string): Promise<{ data: Category[] | null; error: any }> {
    try {
      let dbQuery = supabase
        .from('categories')
        .select('id, name, slug, feature_type, description, is_active, sort_order, icon_name, parent_id')
        .ilike('name', `%${query.trim()}%`)
        .eq('is_active', true)
        .order('name')

      if (featureType) {
        dbQuery = dbQuery.eq('feature_type', featureType)
      }

      const { data, error } = await dbQuery

      if (error) {
        console.error('Error searching categories:', error)
        return { data: null, error }
      }

      return { data: data || [], error: null }

    } catch (error) {
      console.error('Unexpected error in searchCategories:', error)
      return { data: null, error }
    }
  },

  /**
   * Get popular categories (most used)
   */
  async getPopularCategories(featureType: 'business' | 'tourism', limit: number = 10): Promise<{ data: CategoryWithStats[] | null; error: any }> {
    try {
      if (featureType === 'business') {
        const { data } = await this.getBusinessCategoriesWithStats()
        if (!data) return { data: null, error: 'Failed to fetch categories' }
        
        return {
          data: data
            .sort((a, b) => (b.business_count || 0) - (a.business_count || 0))
            .slice(0, limit),
          error: null
        }
      } else {
        const { data } = await this.getTourismCategoriesWithStats()
        if (!data) return { data: null, error: 'Failed to fetch categories' }
        
        return {
          data: data
            .sort((a, b) => (b.tourism_count || 0) - (a.tourism_count || 0))
            .slice(0, limit),
          error: null
        }
      }

    } catch (error) {
      console.error('Unexpected error in getPopularCategories:', error)
      return { data: null, error }
    }
  }
}