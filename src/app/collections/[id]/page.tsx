// src/app/collections/[id]/page.tsx
// Individual collection view page

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { collectionsService, type CollectionWithItems, type SavedItem } from '@/lib/services/collections'
import { Heart, ArrowLeft, Eye, EyeOff, Edit, Trash2, ExternalLink, MapPin, Calendar, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface SavedItemCardProps {
  item: SavedItem
  onRemove: (item: SavedItem) => void
}

// Saved Item Card Component
function SavedItemCard({ item, onRemove }: SavedItemCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getItemLink = () => {
    switch (item.entity_type) {
      case 'business':
        return `/business/${item.entity_slug}`
      case 'tourism_place':
        return `/tourism/${item.entity_slug}`
      case 'blog_post':
        return `/blog/${item.entity_slug}`
      default:
        return '#'
    }
  }

  const getEntityTypeLabel = () => {
    switch (item.entity_type) {
      case 'business':
        return 'Business'
      case 'tourism_place':
        return 'Tourism'
      case 'blog_post':
        return 'Blog'
      case 'job':
        return 'Job'
      case 'event':
        return 'Event'
      default:
        return 'Item'
    }
  }

  const getEntityIcon = () => {
    switch (item.entity_type) {
      case 'business':
        return '🏢'
      case 'tourism_place':
        return '🏛️'
      case 'blog_post':
        return '📝'
      case 'job':
        return '💼'
      case 'event':
        return '📅'
      default:
        return '📄'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Entity Type Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getEntityIcon()}</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {getEntityTypeLabel()}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {item.entity_name || 'Unknown Item'}
            </h3>

            {/* Notes */}
            {item.notes && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {item.notes}
              </p>
            )}

            {/* Saved Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Calendar className="w-3 h-3" />
              <span>
                Saved {new Date(item.added_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {item.entity_slug && (
                <Link 
                  href={getItemLink()}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </Link>
              )}
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36">
                <button
                  onClick={() => {
                    onRemove(item)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click anywhere outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

// Main Collection Detail Page
export default function CollectionDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<CollectionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (collectionId) {
      loadCollection()
    }
  }, [collectionId])

  const loadCollection = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await collectionsService.getCollectionWithItems(collectionId)
    
    if (fetchError) {
      setError('Collection not found or you don\'t have permission to view it')
      console.error('Error loading collection:', fetchError)
    } else if (data) {
      // Check if user has permission to view this collection
      if (!user || (data.user_id !== user.id && !data.is_public)) {
        setError('You don\'t have permission to view this collection')
      } else {
        setCollection(data)
      }
    } else {
      setError('Collection not found')
    }
    
    setLoading(false)
  }

  const handleRemoveItem = async (item: SavedItem) => {
    if (!collection || !user) return

    // Check permission
    if (collection.user_id !== user.id) {
      alert('You can only remove items from your own collections')
      return
    }

    if (confirm(`Remove "${item.entity_name}" from this collection?`)) {
      const { success } = await collectionsService.unsaveItem(
        collection.id,
        item.entity_type,
        item.entity_id
      )

      if (success) {
        // Remove item from local state
        setCollection(prev => prev ? {
          ...prev,
          items: prev.items.filter(i => i.id !== item.id),
          item_count: (prev.item_count || 0) - 1
        } : null)
      } else {
        alert('Failed to remove item')
      }
    }
  }

  const handleEditCollection = () => {
    router.push(`/collections?edit=${collection?.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Back to Collections
          </button>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Collection Not Found</h1>
          <button
            onClick={() => router.push('/collections')}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Back to Collections
          </button>
        </div>
      </div>
    )
  }

  const isOwner = user && collection.user_id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-600 mt-1">{collection.description}</p>
              )}
            </div>
            {isOwner && (
              <button
                onClick={handleEditCollection}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Collection Meta */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{collection.item_count || 0} items</span>
            </div>
            <div className="flex items-center gap-1">
              {collection.is_public ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Public Collection</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Private Collection</span>
                </>
              )}
            </div>
            <span>
              Created {new Date(collection.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {collection.items.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Items Yet</h3>
            <p className="text-gray-600 mb-6">
              {isOwner 
                ? 'Start saving items to see them here' 
                : 'This collection is empty'
              }
            </p>
            {isOwner && (
              <Link
                href="/"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium inline-block"
              >
                Explore & Save Items
              </Link>
            )}
          </div>
        ) : (
          // Items Grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collection.items.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}