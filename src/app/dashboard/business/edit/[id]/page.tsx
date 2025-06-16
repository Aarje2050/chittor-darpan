// src/app/dashboard/business/edit/[id]/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EditBusinessPageProps {
  params: { id: string }
}

export default function EditBusinessPage({ params }: EditBusinessPageProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Business</h1>
        <p className="text-gray-600">Update your business information and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Edit Form</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Business Edit Form</h3>
          <p className="text-gray-600 mb-4">
            Business ID: {params.id}
            <br />
            This feature will be implemented in the next development phase.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => router.push('/dashboard/business/my-listings')}
              variant="outline"
            >
              Back to Listings
            </Button>
            <Button
              onClick={() => router.push('/dashboard/business')}
            >
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}