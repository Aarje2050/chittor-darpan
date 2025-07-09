// src/components/ui/save-button.tsx
// Universal save button component for all content types

'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { collectionsService, type UserCollection, type SaveItemData } from '@/lib/services/collections'

interface SaveButtonProps {
  entityType: 'business' | 'tourism_place' | 'blog_post' | 'job' | 'event'
  entityId: string
  entityName: string // For collection modal
  variant?: 'icon' | 'text' | 'card'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: SaveButtonProps['entityType']
  entityId: string
  entityName: string
  onSaved: () => void
}

// Save to Collection Modal
function SaveModal({ isOpen, onClose, entityType, entityId, entityName, onSaved }: SaveModalProps) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<UserCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Load user collections
  useEffect(() => {
    if (isOpen && user) {
      loadCollections()
    }
  }, [isOpen, user])

  const loadCollections = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await collectionsService.getUserCollections(user.id)
    
    if (error) {
      console.error('Error loading collections:', error)
    } else {
      setCollections(data || [])
    }
    setLoading(false)
  }

  const handleSaveToCollection = async (collectionId: string) => {
    if (!user) return

    setSaving(true)
    const saveData: SaveItemData = {
      collection_id: collectionId,
      entity_type: entityType,
      entity_id: entityId
    }

    const { success, error } = await collectionsService.saveItem(saveData)
    
    if (success) {
      onSaved()
      onClose()
    } else {
      if (error === 'Item already saved in this collection') {
        alert('Already saved in this collection!')
      } else {
        alert('Failed to save item')
      }
    }
    setSaving(false)
  }

  const handleCreateAndSave = async () => {
    if (!user || !newCollectionName.trim()) return

    setSaving(true)
    
    // Create new collection
    const { data: newCollection, error: createError } = await collectionsService.createCollection(user.id, {
      name: newCollectionName.trim(),
      is_public: false
    })

    if (createError || !newCollection) {
      alert('Failed to create collection')
      setSaving(false)
      return
    }

    // Save item to new collection
    await handleSaveToCollection(newCollection.id)
    
    // Reset form
    setNewCollectionName('')
    setShowCreateForm(false)
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:w-96 md:rounded-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Save to Collection</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={saving}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Saving: {entityName}</p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading collections...</p>
            </div>
          ) : (
            <>
              {/* Create New Collection */}
              <div className="mb-4">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 w-full p-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Create New Collection</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Collection name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      maxLength={100}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateAndSave}
                        disabled={!newCollectionName.trim() || saving}
                        className="flex-1 bg-black text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? 'Creating...' : 'Create & Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewCollectionName('')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Collections */}
              {collections.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Collections</h4>
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleSaveToCollection(collection.id)}
                      disabled={saving}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{collection.name}</h5>
                          <p className="text-xs text-gray-600">
                            {collection.item_count || 0} items
                            {collection.is_public && ' • Public'}
                          </p>
                        </div>
                        <Heart className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                !showCreateForm && (
                  <div className="text-center py-8">
                    <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No collections yet</p>
                    <p className="text-xs text-gray-500">Create your first collection above</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Save Button Component
export default function SaveButton({ 
  entityType, 
  entityId, 
  entityName,
  variant = 'icon',
  size = 'md',
  className = ''
}: SaveButtonProps) {
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Check if item is already saved
  useEffect(() => {
    if (user) {
      checkSavedStatus()
    }
  }, [user, entityType, entityId])

  const checkSavedStatus = async () => {
    if (!user) return

    setLoading(true)
    const { data } = await collectionsService.isItemSaved(user.id, entityType, entityId)
    setIsSaved(data)
    setLoading(false)
  }

  const handleClick = () => {
    if (!user) {
      // Redirect to login or show login modal
      alert('Please login to save items')
      return
    }

    setShowModal(true)
  }

  const handleSaved = () => {
    setIsSaved(true)
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-12 h-12 p-3'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 ${className}`}
        >
          <Heart 
            className={`${iconSizes[size]} ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
          <span className="text-sm font-medium">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </button>

        <SaveModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          onSaved={handleSaved}
        />
      </>
    )
  }

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={loading}
          className={`${sizeClasses[size]} bg-white border border-gray-200 hover:border-gray-300 rounded-full transition-colors disabled:opacity-50 shadow-sm ${className}`}
        >
          <Heart 
            className={`${iconSizes[size]} ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        <SaveModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          onSaved={handleSaved}
        />
      </>
    )
  }

  // Default: icon variant
  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${sizeClasses[size]} bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 ${className}`}
      >
        <Heart 
          className={`${iconSizes[size]} ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
        />
      </button>

      <SaveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        onSaved={handleSaved}
      />
    </>
  )
}