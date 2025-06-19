'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { businessService, userService } from './database'



interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  // Future methods (will implement later)
  // signInWithPhone: (phone: string) => Promise<void>
  // signInWithEmail: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        // Handle OAuth callback if present
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error)
        }
        
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully')
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ User signed out successfully')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }

      // OAuth will redirect, so we don't set loading to false here
    } catch (error) {
      console.error('Google sign in error:', error)
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // Clear state immediately
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth guard hook for protecting routes
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirect(true)
    }
  }, [user, loading])

  return { user, loading, shouldRedirect }
}

// Extended auth hook with role checking
export function useAuthWithRole() {
  const { user, loading } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (user && !userRole) {
      const fetchRole = async () => {
        try {
          const { data: role } = await userService.getCurrentUserRole(user.id)
          setUserRole(role || 'user')
        } catch (error) {
          console.error('Error fetching user role:', error)
          setUserRole('user')
        } finally {
          setRoleLoading(false)
        }
      }
      fetchRole()
    } else if (!user && !loading) {
      setUserRole(null)
      setRoleLoading(false)
    }
  }, [user, loading, userRole])

  return {
    user,
    userRole,
    loading: loading || roleLoading,
    isAuthenticated: !!user,
    isAdmin: userRole === 'admin',
    isBusinessOwner: userRole === 'business_owner' || userRole === 'admin',
    isUser: userRole === 'user'
  }
}

// Role-based route protection hook
export function useRoleGuard(
  allowedRoles: ('user' | 'business_owner' | 'admin')[],
  redirectTo: string = '/login'
) {
  const router = useRouter()
  const { user, userRole, loading } = useAuthWithRole()
  const [hasAccess, setHasAccess] = useState(false)
  const [checkComplete, setCheckComplete] = useState(false)

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Check role permission
      if (userRole) {
        const hasPermission = allowedRoles.includes(userRole as any)
        setHasAccess(hasPermission)
        setCheckComplete(true)

        // If no permission and not going to an error page, redirect
        if (!hasPermission && !redirectTo.includes('unauthorized')) {
          router.push(`/unauthorized?required=${allowedRoles.join(',')}&current=${userRole}`)
        }
      }
    }
  }, [user, userRole, loading, allowedRoles, redirectTo, router])

  return {
    hasAccess,
    loading,
    checkComplete,
    user,
    userRole
  }
}

// Quick check functions for components
export function useIsAdmin() {
  const { isAdmin, loading } = useAuthWithRole()
  return { isAdmin, loading }
}

export function useIsBusinessOwner() {
  const { isBusinessOwner, loading } = useAuthWithRole()
  return { isBusinessOwner, loading }
}

// Check if user owns specific business
export function useBusinessOwnership(businessId: string) {
  const { user, userRole, loading } = useAuthWithRole()
  const [isOwner, setIsOwner] = useState(false)
  const [checkLoading, setCheckLoading] = useState(true)

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user || !businessId || loading) {
        setCheckLoading(false)
        return
      }

      // Admins have access to all businesses
      if (userRole === 'admin') {
        setIsOwner(true)
        setCheckLoading(false)
        return
      }

      // Check if user owns this specific business
      try {
        const { data: businesses } = await businessService.getBusinesses({
          ownerId: user.id,
          status: 'all'
        })

        const ownsThisBusiness = businesses?.some(b => b.id === businessId) || false
        setIsOwner(ownsThisBusiness)
      } catch (error) {
        console.error('Error checking business ownership:', error)
        setIsOwner(false)
      } finally {
        setCheckLoading(false)
      }
    }

    checkOwnership()
  }, [user, businessId, userRole, loading])

  return {
    isOwner,
    loading: loading || checkLoading,
    userRole
  }
}