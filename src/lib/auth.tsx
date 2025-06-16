'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

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