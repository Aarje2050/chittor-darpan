// src/lib/services/location.ts - Location Service Layer
import { supabase } from '../supabase'

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

// Location Service - For form dropdowns and location-based filtering
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
  },

  /**
   * Get city by ID
   */
  async getCityById(cityId: string): Promise<{ data: City | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('id', cityId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching city by ID:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getCityById:', error)
      return { data: null, error }
    }
  },

  /**
   * Get city by slug
   */
  async getCityBySlug(slug: string): Promise<{ data: City | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching city by slug:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getCityBySlug:', error)
      return { data: null, error }
    }
  },

  /**
   * Get area by ID
   */
  async getAreaById(areaId: string): Promise<{ data: Area | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, slug, city_id')
        .eq('id', areaId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching area by ID:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in getAreaById:', error)
      return { data: null, error }
    }
  }
}