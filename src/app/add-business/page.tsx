// src/app/add-business/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import BusinessAddForm from '@/components/business/business-add-form'

export default function AddBusinessPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Store current URL for return after login
        const returnUrl = '/add-business'
        localStorage.setItem('auth_return_url', returnUrl)
        
        // Redirect to login
        router.push('/login')
      } else {
        setPageLoading(false)
      }
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (will redirect above)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Add Your Business
                </h1>
                <p className="text-sm text-gray-600 hidden md:block">
                  Join Chittor Darpan and reach more customers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section - Mobile Optimized */}
      <div className="px-4 py-6">
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Why list with us?
          </h2>
          <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Get Discovered</h3>
                <p className="text-sm text-blue-700">Local customers find you easily</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Free Listing</h3>
                <p className="text-sm text-blue-700">No cost to get started</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Manage Reviews</h3>
                <p className="text-sm text-blue-700">Respond to feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <BusinessAddForm />
        </div>
      </div>
    </div>
  )
}