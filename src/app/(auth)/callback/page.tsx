// src/app/(auth)/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Callback error:', error)
          setStatus('error')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        if (data.session && data.session.user) {
          console.log('✅ OAuth callback successful')
          setStatus('success')
          
          // Check for stored return URL
          const returnUrl = localStorage.getItem('auth_return_url')
          
          // Redirect after showing success message
          setTimeout(() => {
            if (returnUrl && returnUrl.startsWith('/')) {
              // Clear the stored URL and redirect to it
              localStorage.removeItem('auth_return_url')
              router.push(returnUrl)
            } else {
              // Default redirect to profile
              router.push('/profile')
            }
          }, 1500)
        } else {
          console.log('❌ No session in callback')
          setStatus('error')
          setTimeout(() => router.push('/login'), 2000)
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('error')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    // Small delay to ensure URL parameters are processed
    const timeoutId = setTimeout(handleAuthCallback, 100)
    
    return () => clearTimeout(timeoutId)
  }, [router])

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Processing authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we complete your sign in</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome to Chittor Darpan!</h2>
          <p className="text-gray-600 mt-2">Authentication successful. Redirecting you now...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
        <p className="text-gray-600 mb-6">There was an issue completing your sign in. You'll be redirected to try again.</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium"
        >
          Try Again Now
        </button>
      </div>
    </div>
  )
}