// src/components/business/related-businesses.tsx
'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Business } from '@/lib/database'
import { 
  Building2, 
  MapPin, 
  Star, 
  Award, 
  Phone,
  Clock,
  ChevronRight
} from 'lucide-react'

interface RelatedBusinessesProps {
  businesses: Business[]
  currentBusinessCity: string
}

export default function RelatedBusinesses({ 
  businesses, 
  currentBusinessCity 
}: RelatedBusinessesProps) {
  if (businesses.length === 0) return null

  return (
    <section className="space-y-6 pt-8 border-t border-gray-200">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            More businesses in {currentBusinessCity}
          </h2>
        </div>
        <Link
          href="/businesses"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Business Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map((business) => (
          <Link
            key={business.id}
            href={`/business/${business.slug}`}
            className="group block"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200 group-hover:border-gray-300 border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {business.name}
                      </h3>
                      {business.is_featured && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs flex-shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {business.area_name ? `${business.area_name}, ` : ''}{business.city_name}
                      </span>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {business.is_verified && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {business.phone && business.phone[0] && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        <Phone className="w-3 h-3 mr-1" />
                        Phone
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Open today
                    </Badge>
                  </div>

                  {/* Rating (if available) */}
                  {business.average_rating && business.total_reviews && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${
                              star <= Math.round(business.average_rating!) 
                                ? 'text-amber-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {business.average_rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({business.total_reviews} reviews)
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {business.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {business.description.length > 120 
                        ? `${business.description.substring(0, 120)}...` 
                        : business.description
                      }
                    </p>
                  )}

                  {/* Quick Contact Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {business.phone && business.phone[0] && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>Call available</span>
                      </div>
                    )}
                    {business.whatsapp && (
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>WhatsApp</span>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span>Website</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* View More Link */}
      <div className="text-center pt-4">
        <Link
          href={`/businesses?city=${encodeURIComponent(currentBusinessCity)}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          <Building2 className="w-4 h-4" />
          View all businesses in {currentBusinessCity}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}