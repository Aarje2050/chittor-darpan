// src/types/database.ts
// Centralized database types for type safety across the application

// Base types for common fields
export interface BaseEntity {
    id: string
    created_at: string
    updated_at: string
  }
  
  // User and Auth types
  export interface Profile extends BaseEntity {
    email: string
    full_name: string | null
    phone: string | null
    avatar_url: string | null
    user_type: 'user' | 'business_owner' | 'admin'
    is_verified: boolean
  }
  
  // Location types
  export interface City extends BaseEntity {
    name: string
    slug: string
    state: string
    pincode: string[] | null
    latitude: number | null
    longitude: number | null
    is_active: boolean
  }
  
  export interface Area extends BaseEntity {
    city_id: string
    name: string
    slug: string
    description: string | null
    is_active: boolean
  }
  
  export interface Landmark extends BaseEntity {
    area_id: string
    name: string
    slug: string
    description: string | null
    latitude: number | null
    longitude: number | null
    is_active: boolean
  }
  
  // Category types
  export interface Category extends BaseEntity {
    name: string
    slug: string
    description: string | null
    feature_type: 'business' | 'job' | 'event' | 'news'
    parent_id: string | null
    icon_name: string | null
    is_active: boolean
    sort_order: number
  }
  
  // Business types
  export interface Business extends BaseEntity {
    name: string
    slug: string
    description: string | null
    owner_id: string | null
    
    // Location
    city_id: string | null
    area_id: string | null
    landmark_id: string | null
    address: string
    latitude: number | null
    longitude: number | null
    
    // Contact Information
    phone: string[] | null
    email: string | null
    website: string | null
    whatsapp: string | null
    
    // Business Details
    established_year: number | null
    employee_count: '1-10' | '11-50' | '51-200' | '200+' | null
    
    // Status & Visibility
    status: 'pending' | 'published' | 'rejected' | 'suspended'
    is_featured: boolean
    is_verified: boolean
    
    // SEO
    meta_title: string | null
    meta_description: string | null
    
    // Timestamps
    published_at: string | null
    
    // Related data (populated from joins)
    city_name?: string
    area_name?: string | null
    owner_email?: string
    owner_name?: string | null
  }
  
  export interface BusinessHours extends BaseEntity {
    business_id: string
    day_of_week: number // 0=Sunday, 1=Monday, etc.
    opens_at: string | null
    closes_at: string | null
    is_closed: boolean
  }
  
  export interface BusinessCategory extends BaseEntity {
    business_id: string
    category_id: string
    is_primary: boolean
  }
  
  export interface BusinessReview extends BaseEntity {
    business_id: string
    user_id: string
    rating: number // 1-5
    title: string | null
    content: string | null
    status: 'pending' | 'published' | 'rejected'
    is_verified: boolean
  }
  
  // Filter types
  export interface BusinessFilters {
    status?: 'all' | 'pending' | 'published' | 'rejected' | 'suspended'
    search?: string
    limit?: number
    cityId?: string
    areaId?: string
    categoryId?: string
    featured?: boolean
    verified?: boolean
  }
  
  // Stats types
  export interface BusinessCounts {
    total: number
    pending: number
    published: number
    rejected: number
    suspended: number
  }
  
  // API Response types
  export interface ApiResponse<T> {
    data: T | null
    error: any
  }
  
  export interface ApiSuccessResponse {
    success: boolean
    error: any
  }
  
  // Future feature types (for when we add them)
  
  // Jobs feature types
  export interface JobListing extends BaseEntity {
    title: string
    company_name: string
    category_id: string | null
    area_id: string | null
    posted_by: string
    salary_min: number | null
    salary_max: number | null
    job_type: 'full-time' | 'part-time' | 'freelance' | 'internship'
    experience_level: 'entry' | 'mid' | 'senior' | 'executive'
    description: string | null
    requirements: string | null
    status: 'active' | 'closed' | 'draft'
    expires_at: string | null
  }
  
  // Events feature types
  export interface Event extends BaseEntity {
    title: string
    description: string | null
    category_id: string | null
    area_id: string | null
    organizer_id: string
    start_datetime: string
    end_datetime: string | null
    venue_address: string | null
    ticket_price: number | null
    max_attendees: number | null
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  }
  
  // AI feature types
  export interface UserRecommendation extends BaseEntity {
    user_id: string
    entity_type: 'business' | 'job' | 'event'
    entity_id: string
    recommendation_score: number
    recommendation_reason: string | null
  }
  
  