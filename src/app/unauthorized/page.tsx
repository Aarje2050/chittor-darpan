// src/app/unauthorized/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthWithRole } from '@/lib/auth'
import { Suspense } from 'react'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userRole } = useAuthWithRole()

  const required = searchParams.get('required')?.split(',') || []
  const current = searchParams.get('current') || userRole || 'unknown'

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'business_owner': return 'Business Owner'
      case 'user': return 'User'
      default: return 'Unknown'
    }
  }

  const getHelpText = () => {
    if (current === 'user' && required.includes('business_owner')) {
      return 'Add your business to get business owner access, or contact admin for permission.'
    }
    if (current === 'user' && required.includes('admin')) {
      return 'Contact the administrator to request access.'
    }
    if (current === 'business_owner' && required.includes('admin')) {
      return 'This area is restricted to administrators only.'
    }
    return 'You need different permissions to access this area.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Icon */}
          <div className="text-red-500 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          {/* Current Role */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Your current role:</p>
            <p className="font-semibold text-gray-900">{getRoleDisplayName(current)}</p>
          </div>

          {/* Required Roles */}
          {required.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-600 mb-1">Required role(s):</p>
              <p className="font-semibold text-blue-900">
                {required.map(getRoleDisplayName).join(' or ')}
              </p>
            </div>
          )}
          
          {/* Help Text */}
          <p className="text-gray-600 mb-8">
            {getHelpText()}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Home
            </button>
            
            {current === 'user' && required.includes('business_owner') && (
              <button
                onClick={() => router.push('/add-business')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Add Your Business
              </button>
            )}

            <button
              onClick={() => router.back()}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:admin@chittordarpan.com" className="text-blue-600 hover:underline">
                admin@chittordarpan.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}