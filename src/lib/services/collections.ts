// src/lib/services/collections.ts - Collections Service Layer
import { supabase } from '../supabase'

// Types
export interface UserCollection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  item_count?: number // Added via function or manual count
}

export interface SavedItem {
  id: string
  collection_id: string
  entity_type: 'business' | 'tourism_place' | 'blog_post' | 'job' | 'event'
  entity_id: string
  notes: string | null
  added_at: string
  // Related data (populated via joins)
  entity_name?: string
  entity_slug?: string | null
  entity_image?: string | null
}

export interface CollectionFormData {
  name: string
  description?: string
  is_public?: boolean
}

export interface SaveItemData {
  collection_id: string
  entity_type: SavedItem['entity_type']
  entity_id: string
  notes?: string
}

export interface CollectionWithItems extends UserCollection {
  items: SavedItem[]
}

export interface CollectionStats {
  totalCollections: number
  publicCollections: number
  privateCollections: number
  totalSavedItems: number
}

// Collections Service
export const collectionsService = {
  /**
   * Get user's collections with optional item counts
   */
  async getUserCollections(userId: string, includeItemCount: boolean = true): Promise<{ data: UserCollection[] | null; error: any }> {
    try {
      let query = supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user collections:', error)
        return { data: null, error }
      }

      let collections = data || []

      // Add item counts if requested
      if (includeItemCount && collections.length > 0) {
        const collectionsWithCounts = await Promise.all(
          collections.map(async (collection) => {
            const { count } = await supabase
              .from('saved_items')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id)

            return {
              ...collection,
              item_count: count || 0
            }
          })
        )
        collections = collectionsWithCounts
      }

      return { data: collections, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserCollections:', error)
      return { data: null, error }
    }
  },

  /**
   * Get public collections (for discovery)
   */
  async getPublicCollections(limit: number = 20): Promise<{ data: UserCollection[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching public collections:', error)
        return { data: null, error }
      }

      // Add item counts for public collections
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from('saved_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id)

          return {
            ...collection,
            item_count: count || 0,
            owner_name: collection.profiles?.full_name || 'Anonymous User',
            owner_avatar: collection.profiles?.avatar_url || null
          }
        })
      )

      return { data: collectionsWithCounts, error: null }

    } catch (error) {
      console.error('Unexpected error in getPublicCollections:', error)
      return { data: null, error }
    }
  },

  /**
   * Get collection by ID with items
   */
  async getCollectionWithItems(collectionId: string): Promise<{ data: CollectionWithItems | null; error: any }> {
    try {
      // Get collection details
      const { data: collection, error: collectionError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('id', collectionId)
        .single()

      if (collectionError) {
        console.error('Error fetching collection:', collectionError)
        return { data: null, error: collectionError }
      }

      // Get collection items
      const { data: items, error: itemsError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false })

      if (itemsError) {
        console.error('Error fetching collection items:', itemsError)
        return { data: null, error: itemsError }
      }

      // Enrich items with entity details
      const enrichedItems = await this.enrichSavedItems(items || [])

      const collectionWithItems: CollectionWithItems = {
        ...collection,
        item_count: enrichedItems.length,
        items: enrichedItems
      }

      return { data: collectionWithItems, error: null }

    } catch (error) {
      console.error('Unexpected error in getCollectionWithItems:', error)
      return { data: null, error }
    }
  },

  /**
   * Enrich saved items with entity details (name, slug, image)
   */
  async enrichSavedItems(items: SavedItem[]): Promise<SavedItem[]> {
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let entityDetails = {
          entity_name: 'Unknown Item',
          entity_slug: null as string | null,
          entity_image: null as string | null
        }

        try {
          switch (item.entity_type) {
            case 'business':
              const { data: business } = await supabase
                .from('businesses')
                .select('name, slug')
                .eq('id', item.entity_id)
                .single()
              
              if (business) {
                entityDetails = {
                  entity_name: business.name,
                  entity_slug: business.slug,
                  entity_image: null // Add image logic if you have business images
                }
              }
              break

            case 'tourism_place':
              const { data: tourism } = await supabase
                .from('tourism_places')
                .select('name, slug')
                .eq('id', item.entity_id)
                .single()
              
              if (tourism) {
                entityDetails = {
                  entity_name: tourism.name,
                  entity_slug: tourism.slug,
                  entity_image: null
                }
              }
              break

            case 'blog_post':
              // Add blog post enrichment when you have blog posts in database
              entityDetails = {
                entity_name: 'Blog Post',
                entity_slug: null,
                entity_image: null
              }
              break

            default:
              // Future entity types
              break
          }
        } catch (error) {
          console.error(`Error enriching ${item.entity_type}:`, error)
        }

        return {
          ...item,
          ...entityDetails
        }
      })
    )

    return enrichedItems
  },

  /**
   * Create new collection
   */
  async createCollection(userId: string, formData: CollectionFormData): Promise<{ data: UserCollection | null; error: any }> {
    try {
      const collectionData = {
        user_id: userId,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        is_public: formData.is_public || false
      }

      const { data, error } = await supabase
        .from('user_collections')
        .insert([collectionData])
        .select()
        .single()

      if (error) {
        console.error('Error creating collection:', error)
        return { data: null, error }
      }

      return { data: { ...data, item_count: 0 }, error: null }

    } catch (error) {
      console.error('Unexpected error in createCollection:', error)
      return { data: null, error }
    }
  },

  /**
   * Update collection
   */
  async updateCollection(collectionId: string, updates: Partial<CollectionFormData>): Promise<{ data: UserCollection | null; error: any }> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_collections')
        .update(updateData)
        .eq('id', collectionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating collection:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('Unexpected error in updateCollection:', error)
      return { data: null, error }
    }
  },

  /**
   * Delete collection
   */
  async deleteCollection(collectionId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionId)

      if (error) {
        console.error('Error deleting collection:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in deleteCollection:', error)
      return { success: false, error }
    }
  },

  /**
   * Save item to collection
   */
  async saveItem(data: SaveItemData): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('saved_items')
        .insert([data])

      if (error) {
        // Handle duplicate save gracefully
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Item already saved in this collection' }
        }
        console.error('Error saving item:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in saveItem:', error)
      return { success: false, error }
    }
  },

  /**
   * Remove item from collection
   */
  async unsaveItem(collectionId: string, entityType: string, entityId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) {
        console.error('Error removing item:', error)
        return { success: false, error }
      }

      return { success: true, error: null }

    } catch (error) {
      console.error('Unexpected error in unsaveItem:', error)
      return { success: false, error }
    }
  },

  /**
   * Check if item is saved by user (in any collection)
   */
  async isItemSaved(userId: string, entityType: string, entityId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('is_item_saved', {
          user_uuid: userId,
          item_type: entityType,
          item_id: entityId
        })

      if (error) {
        console.error('Error checking if item is saved:', error)
        return { data: false, error }
      }

      return { data: data || false, error: null }

    } catch (error) {
      console.error('Unexpected error in isItemSaved:', error)
      return { data: false, error }
    }
  },

  /**
   * Get collections where item is saved
   */
  async getItemCollections(userId: string, entityType: string, entityId: string): Promise<{ data: UserCollection[] | null; error: any }> {
    try {
      // First get the collection IDs for this item
      const { data: savedItems, error: savedItemsError } = await supabase
        .from('saved_items')
        .select('collection_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (savedItemsError) {
        console.error('Error fetching saved items:', savedItemsError)
        return { data: null, error: savedItemsError }
      }

      if (!savedItems || savedItems.length === 0) {
        return { data: [], error: null }
      }

      const collectionIds = savedItems.map(item => item.collection_id)

      // Then get the collections that belong to this user
      const { data: collections, error: collectionsError } = await supabase
        .from('user_collections')
        .select('*')
        .in('id', collectionIds)
        .eq('user_id', userId)

      if (collectionsError) {
        console.error('Error fetching collections:', collectionsError)
        return { data: null, error: collectionsError }
      }

      return { data: collections || [], error: null }

    } catch (error) {
      console.error('Unexpected error in getItemCollections:', error)
      return { data: null, error }
    }
  },

  /**
   * Get user's collection statistics
   */
  async getUserStats(userId: string): Promise<{ data: CollectionStats | null; error: any }> {
    try {
      const { data: collections } = await this.getUserCollections(userId, true)
      
      if (!collections) {
        return { data: null, error: 'Could not fetch collections' }
      }

      const stats: CollectionStats = {
        totalCollections: collections.length,
        publicCollections: collections.filter(c => c.is_public).length,
        privateCollections: collections.filter(c => !c.is_public).length,
        totalSavedItems: collections.reduce((sum, c) => sum + (c.item_count || 0), 0)
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('Unexpected error in getUserStats:', error)
      return { data: null, error }
    }
  }
}