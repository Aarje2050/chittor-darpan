// src/app/messages/page.tsx - Messages Page
'use client'

import React from 'react'
import { useRequireAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MessagesInterface from '@/components/messaging/messages-interface'

export default function MessagesPage() {
  const { user, loading, shouldRedirect } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login')
    }
  }, [shouldRedirect, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MessagesInterface />
    </div>
  )
}