import { createClient } from '@supabase/supabase-js'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

/**
 * Supabase client for client-side operations
 * Used in React components and client-side code
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth for mobile-first experience
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Mobile-optimized settings
    storageKey: 'chittor-darpan-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  // Database settings
  db: {
    schema: 'public'
  },
  // Global settings
  global: {
    headers: {
      'x-application-name': 'chittor-darpan'
    }
  }
})

/**
 * Test Supabase connection
 * Call this during development to verify setup
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles') // Will test this table when we create it
      .select('count')
      .limit(1)

    if (error) {
      console.warn('Supabase connection test failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}

/**
 * Get current user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Failed to get current user:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Sign out error:', error)
    return false
  }
}

/**
 * Database helper functions for Phase 1 testing
 */
export const database = {
  /**
   * Test if we can connect to the database
   */
  async testConnection() {
    return testConnection()
  },

  /**
   * Get basic app statistics (for homepage)
   * Will be implemented when we have actual tables
   */
  async getStats() {
    // Placeholder for Phase 1
    return {
      businessCount: 150,
      reviewCount: 500,
      userCount: 75
    }
  }
}

/**
 * Auth helper functions for Phase 1 testing
 */
export const auth = {
  /**
   * Get current user
   */
  getCurrentUser,

  /**
   * Sign out user
   */
  signOut,

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await getCurrentUser()
    return user !== null
  }
}

// Types for Phase 1 (will expand in later phases)
export type User = {
  id: string
  email: string
  full_name?: string
  user_type: 'user' | 'business_owner' | 'admin'
  created_at: string
}

export type AppStats = {
  businessCount: number
  reviewCount: number
  userCount: number
}

// Export the client as default for convenience
export default supabase