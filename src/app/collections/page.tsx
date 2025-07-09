// src/app/collections/page.tsx
// Main collections management page

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collectionsService, type UserCollection, type CollectionWithItems } from '@/lib/services/collections'
import { Heart, Plus, Eye, EyeOff, Edit, Trash2, ExternalLink, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CollectionCardProps {
  collection: UserCollection
  onEdit: (collection: UserCollection) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

interface EditCollectionModalProps {
  collection: UserCollection | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

interface DeleteConfirmModalProps {
  isOpen: boolean
  collectionName: string
  onConfirm: () => void
  onCancel: () => void
}

// Edit Collection Modal
function EditCollectionModal({ collection, isOpen, onClose, onSaved }: EditCollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || '')
      setIsPublic(collection.is_public)
    }
  }, [collection])

  const handleSave = async () => {
    if (!collection || !name.trim()) return

    setSaving(true)
    const { error } = await collectionsService.updateCollection(collection.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      is_public: isPublic
    })

    if (error) {
      alert('Failed to update collection')
    } else {
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  if (!isOpen || !collection) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:w-96 md:rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Collection</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              maxLength={100}
              placeholder="Enter collection name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={3}
              maxLength={500}
              placeholder="Describe your collection"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <label htmlFor="isPublic" className="text-sm">
              Make this collection public
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, collectionName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm mx-4 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Delete Collection</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "<strong>{collectionName}</strong>"? 
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Collection Card Component
function CollectionCard({ collection, onEdit, onDelete, onClick }: CollectionCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Collection Content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onClick(collection.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{collection.name}</h3>
            {collection.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{collection.item_count || 0} items</span>
              <div className="flex items-center gap-1">
                {collection.is_public ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(collection)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(collection.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
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

// Main Collections Page Component
export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [collections, setCollections] = useState<UserCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCollection, setEditingCollection] = useState<UserCollection | null>(null)
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null)
  const [deletingCollectionName, setDeletingCollectionName] = useState('')

  useEffect(() => {
    // Wait for auth to load first
    if (authLoading) return
    
    if (user) {
      loadCollections()
    } else {
      // Redirect to login with return URL
      router.push('/login?returnUrl=/collections')
    }
  }, [user, authLoading, router])

  const loadCollections = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await collectionsService.getUserCollections(user.id, true)
    
    if (error) {
      console.error('Error loading collections:', error)
    } else {
      setCollections(data || [])
    }
    setLoading(false)
  }

  const handleCreateCollection = () => {
    const name = prompt('Collection name:')
    if (!name?.trim()) return

    createCollection(name.trim())
  }

  const createCollection = async (name: string) => {
    if (!user) return

    const { error } = await collectionsService.createCollection(user.id, {
      name,
      is_public: false
    })

    if (error) {
      alert('Failed to create collection')
    } else {
      loadCollections()
    }
  }

  const handleDeleteCollection = async () => {
    if (!deletingCollectionId) return

    const { error } = await collectionsService.deleteCollection(deletingCollectionId)
    
    if (error) {
      alert('Failed to delete collection')
    } else {
      loadCollections()
    }
    
    setDeletingCollectionId(null)
    setDeletingCollectionName('')
  }

  const startDelete = (id: string) => {
    const collection = collections.find(c => c.id === id)
    if (collection) {
      setDeletingCollectionId(id)
      setDeletingCollectionName(collection.name)
    }
  }

  const handleCollectionClick = (id: string) => {
    router.push(`/collections/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Collections</h1>
              <p className="text-gray-600 mt-1">
                Organize your saved items into collections
              </p>
            </div>
            <button
              onClick={handleCreateCollection}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {collections.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first collection to start organizing your saved items
            </p>
            <button
              onClick={handleCreateCollection}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Collection
            </button>
          </div>
        ) : (
          // Collections Grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={setEditingCollection}
                onDelete={startDelete}
                onClick={handleCollectionClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      <EditCollectionModal
        collection={editingCollection}
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        onSaved={() => {
          loadCollections()
          setEditingCollection(null)
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCollectionId}
        collectionName={deletingCollectionName}
        onConfirm={handleDeleteCollection}
        onCancel={() => {
          setDeletingCollectionId(null)
          setDeletingCollectionName('')
        }}
      />
    </div>
  )
}